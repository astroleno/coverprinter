"use client";
import React, { useEffect, useRef, useState } from 'react';

interface BreathBgProps {
  themeColor?: string; // 主题色（如#769164）
}

/**
 * 多弥散圆动态背景组件：
 * - 鼠标跟随圆的中心点精确跟随鼠标
 * - 其余5个圆匀速漂移，碰到边界反弹，大小和明度随各自正弦函数独立变化
 * - 主题色可自定义，明度有差异
 * - API加载时加速
 */
interface Circle {
  id: number;
  x: number; // 0~1
  y: number; // 0~1
  vx: number; // 速度x
  vy: number; // 速度y
  baseR: number;
  color: string;
  baseOpacity: number;
  freq: number;
  phase: number;
}

let circleId = 0;

export default function BreathBg({ themeColor = "#769164" }: BreathBgProps) {
  const [circles, setCircles] = useState<Circle[]>([]);
  const mouse = useRef({ x: 0.6, y: 0.55 });
  const loadingRef = useRef(false);
  const followRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(Date.now());

  // 监听全局loading状态
  useEffect(() => {
    function onLoading(e: CustomEvent) {
      loadingRef.current = !!e.detail;
    }
    window.addEventListener('coverprinter-loading', onLoading as EventListener);
    return () => {
      window.removeEventListener('coverprinter-loading', onLoading as EventListener);
    };
  }, []);

  // 监听鼠标移动
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      mouse.current.x = e.clientX / window.innerWidth;
      mouse.current.y = e.clientY / window.innerHeight;
    }
    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  // 生成竹绿色纯色背景，避免色彩断层
  function getColorList() {
    // 统一竹绿色纯色，通过opacity控制透明度，避免渐变断层
    return [
      '#769164',
      '#769164',
      '#769164',
      '#769164',
      '#769164',
    ];
  }

  // 初始化5个常驻圆，匀速运动
  useEffect(() => {
    const colorList = getColorList();
    const arr: Circle[] = [];
    for (let i = 0; i < 5; ++i) {
      const x = 0.1 + Math.random() * 0.8;
      const y = 0.1 + Math.random() * 0.8;
      // 匀速方向，速度幅度0.001~0.003，整体更慢
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.001 + Math.random() * 0.002;
      arr.push({
        id: ++circleId,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        baseR: 0.18 + Math.random() * 0.22,
        color: colorList[i % colorList.length],
        baseOpacity: 0.22 + Math.random() * 0.18,
        freq: 0.12 + Math.random() * 0.08 + i * 0.03,
        phase: Math.random() * Math.PI * 2,
      });
    }
    setCircles(arr);
    // eslint-disable-next-line
  }, []);

  // 匀速运动动画帧
  useEffect(() => {
    let running = true;
    function animate() {
      setCircles(list =>
        list.map(c => {
          let { x, y, vx, vy } = c;
          // API加载时加速
          const speedMul = loadingRef.current ? 3 : 1;
          x += vx * speedMul;
          y += vy * speedMul;
          // 边界反弹，保持在0.05~0.95之间
          if (x < 0.05) { x = 0.05; vx = Math.abs(vx); }
          if (x > 0.95) { x = 0.95; vx = -Math.abs(vx); }
          if (y < 0.05) { y = 0.05; vy = Math.abs(vy); }
          if (y > 0.95) { y = 0.95; vy = -Math.abs(vy); }
          return { ...c, x, y, vx, vy };
        })
      );
      if (running) requestAnimationFrame(animate);
    }
    animate();
    return () => { running = false; };
  }, []);

  // 鼠标跟随圆样式
  const followStyle: React.CSSProperties = {
    position: 'fixed',
    left: `${mouse.current.x * 100}vw`,
    top: `${mouse.current.y * 100}vh`,
    width: '32vw',
    height: '32vw',
    background: '#769164',
    opacity: 0.28,
    borderRadius: '50%',
    filter: 'blur(60px)',
    pointerEvents: 'none',
    zIndex: 0,
    transform: 'translate(-50%, -50%)',
    transition: 'width 0.3s, height 0.3s',
  };

  // 驱动正弦动画
  useEffect(() => {
    let running = true;
    function tick() {
      setNow(Date.now());
      if (running) requestAnimationFrame(tick);
    }
    tick();
    return () => { running = false; };
  }, []);
  const t = now / 1000;
  const animSpeed = loadingRef.current ? 3 : 1;

  return (
    <div id="breath-bg">
      {/* 鼠标跟随圆，中心点对齐 */}
      <div ref={followRef} style={followStyle} />
      {/* 5个常驻匀速漂移圆，大小/明度正弦变化 */}
      {circles.map((c, i) => {
        const sin = Math.sin(c.freq * animSpeed * t + c.phase);
        const r = c.baseR * (0.82 + 0.18 * (sin + 1) / 2);
        const opacity = c.baseOpacity * (0.7 + 0.3 * (sin + 1) / 2);
        return (
          <div
            key={c.id}
            className="breath-circle"
            style={{
              position: 'fixed',
              left: `${c.x * 100}vw`,
              top: `${c.y * 100}vh`,
              width: `${r * 100}vw`,
              height: `${r * 100}vw`,
              background: c.color,
              opacity,
              borderRadius: '50%',
              filter: 'blur(60px)',
              pointerEvents: 'none',
              zIndex: 0,
              transform: 'translate(-50%, -50%)',
              transition: 'width 0.3s, height 0.3s',
            }}
          />
        );
      })}
    </div>
  );
} 