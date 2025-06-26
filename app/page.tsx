"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Snackbar,
  Collapse,
  IconButton
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import axios from "axios";
import BreathBg from './BreathBg';
let html2canvas: any = null;

// 解析风格文件第一行作为label
function getStyleLabel(content: string, fallback: string) {
  if (!content) return fallback;
  const firstLine = content.split("\n")[0].replace(/^#\s*/, "").trim();
  return firstLine || fallback;
}

interface StyleItem {
  name: string;
  content: string;
}

// 候选模型列表，新增 gemini-2.5-pro，且自定义只保留一个
const modelOptions = [
  { value: "claude-3-7-sonnet-20250219", label: "claude-3-7-sonnet-20250219" },
  { value: "claude-opus-4-20250514", label: "claude-opus-4-20250514" },
  { value: "claude-opus-4-20250514-thinking", label: "claude-opus-4-20250514-thinking" },
  { value: "claude-sonnet-4-20250514", label: "claude-sonnet-4-20250514" },
  { value: "gpt-4o", label: "gpt-4o" },
  { value: "deepseek-r1", label: "deepseek-r1" },
  { value: "qwen-max-latest", label: "qwen-max-latest" },
  { value: "gemini-2.5-pro", label: "gemini-2.5-pro" },
  { value: "custom", label: "自定义..." }, // 只保留一个自定义
];

// 新增：API转发代理URL下拉框选项
const proxyUrlOptions = [
  { value: "https://www.dmxapi.com/v1/chat/completions", label: "https://www.dmxapi.com/v1/chat/completions" },
  { value: "https://yunwu.ai/v1/chat/completions", label: "https://yunwu.ai/v1/chat/completions" },
  { value: "https://api.xi-ai.cn/v1/chat/completions", label: "https://api.xi-ai.cn/v1/chat/completions" },
  { value: "custom", label: "自定义..." },
];

// MVP核心组件
export default function Home() {
  // API转发代理和API Key
  const [proxyUrl, setProxyUrl] = useState("https://www.dmxapi.com/v1/chat/completions");
  const [isCustomProxyUrl, setIsCustomProxyUrl] = useState(false); // 新增：是否自定义API URL
  const [customProxyUrl, setCustomProxyUrl] = useState(""); // 新增：自定义API URL
  const [apiKey, setApiKey] = useState("");
  // 模型名称相关
  const [model, setModel] = useState("claude-opus-4-20250514-thinking");
  const [customModel, setCustomModel] = useState("");
  const [isCustomModel, setIsCustomModel] = useState(false);

  // 状态：模板、风格、风格内容、用户输入、生成结果、加载状态
  const [promptList] = useState([
    { key: "wechat", label: "微信公众号封面", file: "wechat.md" },
    { key: "xhs", label: "小红书封面", file: "xhs.md" },
    { key: "custom", label: "自定义...", file: "" },
  ]);
  const [prompt, setPrompt] = useState("wechat");
  const [styleList, setStyleList] = useState<StyleItem[]>([]); // [{name, content}]
  const [style, setStyle] = useState("");
  const [userInput, setUserInput] = useState<Record<string, string>>({
    title: "别让你的大脑，活成一个人形算法。越是聪明的人，越容易掉进偏见的陷阱。你以为你在判断别人，其实你只是在验证自己。这不是无知，而是你那颗顶级大脑，为了省电而启动的'默认模式'。它不是在帮你看世界，而是在帮你重复自己。",
    coverText: "别让你的大脑，活成一个人形算法。越是聪明的人，越容易掉进偏见的陷阱。你以为你在判断别人，其实你只是在验证自己。这不是无知，而是你那颗顶级大脑，为了省电而启动的'默认模式'。它不是在帮你看世界，而是在帮你重复自己。",
    account: "思维升级",
    slogan: "突破认知边界"
  });
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [htmlPreview, setHtmlPreview] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean, msg: string, detail?: string[]} | null>(null);
  const testResultRef = useRef<HTMLDivElement>(null);
  // 新增：prompt模板内容状态
  const [promptTemplates, setPromptTemplates] = useState<Record<string, string>>({});
  // 新增：生成结果折叠状态
  const [resultCollapsed, setResultCollapsed] = useState(true);
  // 在组件内增加snackbar状态
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const showSnackbar = (msg, severity = 'info') => setSnackbar({ open: true, message: msg, severity });

  // 动态输入项配置
  const inputConfig = {
    wechat: [
      { key: "title", label: "标题", placeholder: "请输入主标题" },
    ],
    xhs: [
      { key: "coverText", label: "封面文案", placeholder: "请输入封面文案" },
      { key: "account", label: "账号名称", placeholder: "请输入账号名称" },
      { key: "slogan", label: "可选标语", placeholder: "请输入可选标语（可留空）" },
    ],
  };

  // 读取prompt模板文件
  useEffect(() => {
    async function fetchPromptTemplates() {
      try {
        console.log('开始加载prompt模板...');
        const templates: Record<string, string> = {};
        for (const promptItem of promptList) {
          if (promptItem.key === 'custom') {
            templates[promptItem.key] = '';
            continue; // 跳过自定义项
          }
          let url = `/api/prompts?type=${promptItem.key}`;
          if (proxyUrl && proxyUrl !== "https://www.dmxapi.com/v1/chat/completions") {
            url = `${proxyUrl}/api/prompts?type=${promptItem.key}`;
          }
          console.log('请求prompt模板URL:', url);
          try {
            const res = await axios.get(url, {
              headers: apiKey ? { "x-api-key": apiKey } : {},
            });
            console.log(`模板 ${promptItem.key} 加载成功:`, res.data.content.substring(0, 100) + '...');
            templates[promptItem.key] = res.data.content;
          } catch (e: any) {
            // 只对非custom项报错
            console.error(`模板 ${promptItem.key} 加载失败:`, e);
            templates[promptItem.key] = '';
          }
        }
        console.log('所有prompt模板加载完成:', Object.keys(templates));
        setPromptTemplates(templates);
      } catch (e: any) {
        const errMsg = e?.response?.data?.error || e?.message || '未知错误';
        console.error('Prompt模板加载失败:', errMsg);
        showSnackbar("Prompt模板加载失败: " + errMsg);
      }
    }
    fetchPromptTemplates();
  }, [promptList]); // 只依赖promptList

  // 读取style目录所有风格文件（仅MVP演示，实际应由API/服务端读取）
  useEffect(() => {
    async function fetchStyles() {
      try {
        console.log('开始加载风格列表...');
        // 修复URL构建逻辑：当proxyUrl是完整API地址时，不应该拼接/api/styles
        let url = "/api/styles"; // 默认使用本地接口
        if (proxyUrl && proxyUrl !== "https://www.dmxapi.com/v1/chat/completions") {
          // 如果proxyUrl不是默认的DMXAPI地址，说明是自定义代理，需要拼接
          url = proxyUrl + "/api/styles";
        }
        console.log('请求风格列表URL:', url);
        
        const res = await axios.get(url, {
          headers: apiKey ? { "x-api-key": apiKey } : {},
        });
        console.log('风格列表加载成功，数据:', res.data);
        setStyleList(res.data);
      } catch (e: any) {
        console.error('风格列表加载失败:', e);
        console.error('错误详情:', e.response?.data || e.message);
        showSnackbar("风格列表加载失败: " + (e.response?.data?.error || e.message || "未知错误"));
      }
    }
    fetchStyles();
    // 移除依赖项，只在组件挂载时加载一次
  }, []); // 空依赖数组，只在组件挂载时执行

  // 动态提取html片段用于预览
  useEffect(() => {
    setHtmlPreview(extractHtml(result));
  }, [result]);

  // 处理表单输入变化
  const handleInputChange = (key: string, value: string) => {
    setUserInput((prev) => ({ ...prev, [key]: value }));
  };

  // 处理模型选择
  const handleModelChange = (value: string) => {
    setModel(value);
    setIsCustomModel(value === "custom");
    if (value !== "custom") setCustomModel("");
  };

  // 构造messages数组，兼容DMXAPI和OpenAI格式
  const buildMessages = () => [
    { 
      role: "system", 
      content: "你是一位优秀的网页和营销视觉设计师。你的任务是生成完整的HTML代码，而不是提供设计建议。你必须严格按照用户提供的风格要求和内容生成可运行的HTML页面。不要输出任何分析、建议或解释文字，只输出HTML代码。" 
    },
    { role: "user", content: buildPrompt() }
  ];

  // 拼接prompt - 完整流程：prompt模板 + 风格 + 用户输入内容
  const buildPrompt = () => {
    const template = promptTemplates[prompt] || "";
    if (!template) {
      console.error('模板未加载:', prompt);
      return "请生成封面设计";
    }

    // 1. 替换风格部分：在## 风格后面插入风格内容
    const styleContent = styleList.find(s => s.name === style)?.content || "";
    console.log('选择的风格:', style);
    console.log('风格内容长度:', styleContent.length);
    
    let finalPrompt = template.replace(
      /## 风格\n/,
      `## 风格\n${styleContent}\n\n`
    );

    // 2. 替换用户输入内容部分
    if (prompt === "wechat") {
      finalPrompt = finalPrompt.replace(
        /{{TITLE}}/g,
        userInput.title || ""
      );
    } else if (prompt === "xhs") {
      finalPrompt = finalPrompt.replace(/{{COVER_TEXT}}/g, userInput.coverText || "");
      finalPrompt = finalPrompt.replace(/{{ACCOUNT}}/g, userInput.account || "");
      finalPrompt = finalPrompt.replace(/{{SLOGAN}}/g, userInput.slogan || "");
    }

    console.log('最终提示词长度:', finalPrompt.length);
    return finalPrompt;
  };

  // 提取html片段（优先<html>，否则<body>，否则<div>）
  function extractHtml(content: string): string {
    if (!content) return "";
    const htmlMatch = content.match(/<html[\s\S]*?<\/html>/i);
    if (htmlMatch) return htmlMatch[0];
    const bodyMatch = content.match(/<body[\s\S]*?<\/body>/i);
    if (bodyMatch) return bodyMatch[0];
    const divMatch = content.match(/<div[\s\S]*?<\/div>/i);
    if (divMatch) return divMatch[0];
    return "";
  }

  // 下载为PNG
  const handleDownloadPng = async () => {
    if (!html2canvas) {
      html2canvas = (await import("html2canvas")).default;
    }
    if (previewRef.current) {
      try {
        // 配置html2canvas以正确捕获blur效果
        const canvas = await html2canvas(previewRef.current, { 
          backgroundColor: null,
          allowTaint: true,
          useCORS: true,
          scale: 2, // 提高分辨率
          logging: false,
          // 确保CSS效果被正确渲染
          onclone: (clonedDoc) => {
            // 在克隆的文档中确保所有样式都被应用
            const clonedElement = clonedDoc.querySelector('[data-preview]');
            if (clonedElement) {
              // 强制重新计算样式
              clonedElement.getBoundingClientRect();
            }
          }
        });
        
        const link = document.createElement("a");
        link.download = "cover-preview.png";
        link.href = canvas.toDataURL("image/png", 1.0);
        link.click();
        
        showSnackbar("PNG下载成功！");
      } catch (error) {
        console.error('下载PNG失败:', error);
        showSnackbar("下载失败：" + (error?.message || "未知错误"));
      }
    } else {
      showSnackbar("请先生成封面内容");
    }
  };

  // 解析流式返回的每一行，提取所有delta下的文本字段
  function extractDeltaText(json: any): string {
    if (!json || !json.choices || !json.choices[0] || !json.choices[0].delta) return '';
    const delta = json.choices[0].delta;
    
    // 对于思考模型，只提取最终答案（content），忽略推理过程（reasoning_content）
    // 这样确保只显示HTML代码，而不是设计分析
    if (delta.content !== undefined) {
      return delta.content;
    }
    
    // 兼容其他模型的流式字段
    return (
      delta.text ||
      delta.reasoning_content ||
      ''
    );
  }

  // 生成按钮：真实API流式输出
  const handleGenerate = async () => {
    setLoading(true);
    setResult("");
    setHtmlPreview("");
    setResultCollapsed(false);
    try {
      const url = proxyUrl || "https://www.dmxapi.com/v1/chat/completions";
      const modelName = isCustomModel ? customModel : model;
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
      const body = JSON.stringify({
        model: modelName,
        messages: buildMessages(),
        stream: true
      });
      const response = await fetch(url, {
        method: "POST",
        headers,
        body
      });
      if (!response.body) throw new Error("无流式响应体");
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let resultText = "";
      let done = false;
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ') && !line.includes('[DONE]')) {
              try {
                const json = JSON.parse(line.replace('data: ', '').trim());
                resultText += extractDeltaText(json);
              } catch {}
            }
          }
          setResult(resultText);
        }
      }
      setLoading(false);
      // 生成完成后播放提示音
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.value = 880; // 清脆
        g.gain.value = 0.08; // 响度不大
        o.connect(g);
        g.connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + 0.18);
        o.onended = () => ctx.close();
      } catch (e) {
        // 忽略音频错误
      }
    } catch (e: any) {
      if (e?.name === "TypeError") {
        showSnackbar("网络错误或CORS跨域问题，或API地址/Key错误");
      } else {
        showSnackbar("生成失败：" + (e?.message || "未知错误"));
      }
      setLoading(false);
    }
  };

  // 下载HTML代码
  const handleDownloadHtml = () => {
    // 自动提取完整<html>...</html>片段，否则下载全部内容
    let html = extractHtml(result);
    if (!html) html = result;
    const blob = new Blob([html], { type: "text/html" });
    const link = document.createElement("a");
    link.download = "cover.html";
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  // 测试API转发代理连通性（POST默认文案到chat/completions）
  const handleTestProxy = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const url = proxyUrl || "https://www.dmxapi.com/v1/chat/completions";
      const modelName = isCustomModel ? customModel : model;
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
      const body = JSON.stringify({
        model: modelName,
        messages: [
          { role: "user", content: "你好！" }
        ],
        stream: false
      });
      const res = await fetch(url, {
        method: "POST",
        headers,
        body
      });
      if (!res.ok) {
        const errText = await res.text();
        setTestResult({
          success: false,
          msg: `连通失败：HTTP ${res.status}`,
          detail: [errText]
        });
        showSnackbar("连通失败：HTTP " + res.status);
      } else {
        const data = await res.json();
        let reply = "";
        if (data.choices && data.choices[0]?.message?.content) {
          reply = data.choices[0].message.content;
        } else if (data.data && data.data.choices && data.data.choices[0]?.message?.content) {
          reply = data.data.choices[0].message.content;
        } else {
          reply = JSON.stringify(data).slice(0, 50);
        }
        setTestResult({
          success: true,
          msg: "连通成功！模型返回：" + reply.slice(0, 50) + (reply.length > 50 ? "..." : ""),
          detail: []
        });
        showSnackbar("连通成功！");
      }
    } catch (e: any) {
      setTestResult({
        success: false,
        msg: "连通失败：" + (e?.message || "未知错误"),
        detail: [e?.stack || ""]
      });
      showSnackbar("连通失败：" + (e?.message || "未知错误"));
    }
    setTestLoading(false);
  };

  // 测试结果变化时自动滚动到卡片
  useEffect(() => {
    if (testResult && testResultRef.current) {
      testResultRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [testResult]);

  // 风格选择自定义项
  const customStyleItem = { name: "custom", content: "自定义..." };

  // 1. 风格下拉框：未选择时自动选中第一个风格
  useEffect(() => {
    if (styleList.length > 0 && !style) {
      setStyle(styleList[0].name);
    }
  }, [styleList]);

  return (
    <>
      {/* 背景动画，传递主题色 */}
      <BreathBg />
      <Box sx={{ maxWidth: 800, mx: 'auto', my: 4 }}>
        {/* API设置卡片 */}
        <Paper sx={{ p: 3, mb: 3, background: '#fff' }} elevation={2}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>API设置</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* API转发代理URL下拉框 */}
            <FormControl fullWidth size="small">
              <InputLabel>API转发代理URL</InputLabel>
              <Select
                value={isCustomProxyUrl ? "custom" : proxyUrl}
                label="API转发代理URL"
                onChange={e => {
                  const val = e.target.value;
                  if (val === "custom") {
                    setIsCustomProxyUrl(true);
                    // 若已有自定义值则用已有，否则清空
                    setProxyUrl(customProxyUrl || "");
                  } else {
                    setIsCustomProxyUrl(false);
                    setProxyUrl(val);
                  }
                }}
              >
                {proxyUrlOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {/* 选中自定义时显示输入框 */}
            {isCustomProxyUrl && (
              <TextField
                label="自定义API转发代理URL"
                value={proxyUrl}
                onChange={e => {
                  setProxyUrl(e.target.value);
                  setCustomProxyUrl(e.target.value);
                }}
                fullWidth
                size="small"
                placeholder="请输入完整的API转发地址"
              />
            )}
            {/* API Key输入框 */}
            <TextField label="API Key（部分API需填写）" value={apiKey} onChange={(e) => setApiKey(e.target.value)} fullWidth size="small" />
            {/* 模型名称下拉框 */}
            <FormControl fullWidth size="small">
              <InputLabel>模型名称</InputLabel>
              <Select value={isCustomModel ? "custom" : model} label="模型名称" onChange={(e) => handleModelChange(e.target.value)}>
                {modelOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {/* 选中自定义模型时显示输入框 */}
            {isCustomModel && (
              <TextField label="自定义模型名称" value={customModel} onChange={(e) => { setCustomModel(e.target.value); setModel(e.target.value); }} fullWidth size="small" />
            )}
            <Box>
              <Button variant="outlined" size="small" onClick={handleTestProxy} disabled={testLoading} sx={{ mr: 2, color: '#769164', borderColor: '#769164', '&:hover': { borderColor: '#5a7a4a', color: '#5a7a4a' } }}>测试连通性</Button>
              {testLoading && <CircularProgress size={18} sx={{ color: '#769164' }} />}
            </Box>
          </Box>
          {testResult && (
            <Paper sx={{ mt: 2, p: 2, background: testResult.success ? '#f8f9f8' : '#fef8f8', border: '1px solid', borderColor: testResult.success ? '#769164' : '#d32f2f' }}>
              <Typography variant="subtitle1" color={testResult.success ? '#769164' : 'error.main'}>{testResult.msg}</Typography>
              {testResult.detail && testResult.detail.length > 0 && (
                <Box component="ul" sx={{ pl: 2, color: '#555', fontSize: 13 }}>
                  {testResult.detail.map((d, i) => <li key={i}>{d}</li>)}
                </Box>
              )}
            </Paper>
          )}
        </Paper>

        {/* 封面提示词卡片 */}
        <Paper sx={{ p: 3, mb: 3, background: '#fff' }} elevation={2}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>封面提示词</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* 选择模板 */}
            <FormControl fullWidth size="small">
              <InputLabel>选择模板</InputLabel>
              <Select value={prompt} label="选择模板" onChange={(e) => setPrompt(e.target.value)}>
                {promptList.map(p => (
                  <MenuItem key={p.key} value={p.key}>{p.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {/* 选择风格 */}
            <FormControl fullWidth size="small">
              <InputLabel>选择风格</InputLabel>
              <Select
                value={style}
                label="选择风格"
                onChange={(e) => setStyle(e.target.value)}
                disabled={styleList.length === 0}
                displayEmpty
              >
                {styleList.length === 0 ? (
                  <MenuItem value="" disabled style={{ color: '#aaa' }}>
                    无可用风格 (已加载 {styleList.length} 个风格)
                  </MenuItem>
                ) : (
                  [...styleList, customStyleItem].map(s => (
                    <MenuItem key={s.name} value={s.name}>{getStyleLabel(s.content, s.name)}</MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
            {/* 自定义模板输入框 */}
            {prompt === 'custom' && (
              <TextField
                label="自定义模板内容"
                placeholder="请输入完整的提示词模板..."
                value={promptTemplates.custom || ''}
                onChange={e => setPromptTemplates(prev => ({ ...prev, custom: e.target.value }))}
                fullWidth
                multiline
                minRows={4}
                size="small"
              />
            )}
            {/* 自定义风格输入框 */}
            {style === 'custom' && (
              <TextField
                label="自定义风格内容"
                placeholder="请输入完整的风格描述..."
                value={customStyleItem.content !== '自定义...' ? customStyleItem.content : ''}
                onChange={e => { customStyleItem.content = e.target.value; setStyleList(list => [...list]); }}
                fullWidth
                multiline
                minRows={3}
                size="small"
              />
            )}
            {/* 普通输入项 */}
            {prompt !== 'custom' && inputConfig[prompt]?.map(item => (
              <TextField key={item.key} label={item.label} placeholder={item.placeholder} value={userInput[item.key] || ""} onChange={(e) => handleInputChange(item.key, e.target.value)} fullWidth size="small" />
            ))}
            <Button
              variant="contained"
              onClick={handleGenerate}
              disabled={
                !style ||
                (prompt !== 'custom' &&
                  inputConfig[prompt]?.some(i => i.key !== 'slogan' && !userInput[i.key])
                ) ||
                loading
              }
              sx={{
                mt: 1,
                bgcolor: '#769164',
                color: '#111',
                fontWeight: 'bold',
                '&:hover': { bgcolor: '#5a7a4a', filter: 'brightness(0.92)' },
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
              }}
            >
              {loading ? <CircularProgress size={20} sx={{ mr: 1, color: '#111' }} /> : null}生成
            </Button>
          </Box>
        </Paper>

        {/* 生成结果卡片 */}
        <Paper sx={{ p: 3, mb: 3, background: '#fff' }} elevation={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>生成结果</Typography>
            <IconButton size="small" onClick={() => setResultCollapsed(!resultCollapsed)} sx={{ color: '#769164' }}>
              {resultCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
            </IconButton>
          </Box>
          <Collapse in={!resultCollapsed} timeout="auto" unmountOnExit>
            <Box sx={{ p: 2, background: '#fff' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ flex: 1, whiteSpace: 'pre-wrap', fontSize: 16 }}>{result}</Typography>
                <IconButton size="small" onClick={() => {navigator.clipboard.writeText(result); showSnackbar('已复制');}} sx={{ color: '#769164' }}><ContentCopyIcon fontSize="small" /></IconButton>
              </Box>
            </Box>
          </Collapse>
        </Paper>

        {/* 预览卡片 */}
        {htmlPreview && (
          <Paper sx={{ p: 3, mb: 3, background: '#fff' }} elevation={2}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>封面预览</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* 预览容器 */}
              <Box 
                ref={previewRef}
                data-preview="true"
                className="preview-container"
                sx={{ 
                  minHeight: 200, 
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  overflow: 'hidden'
                }}
                dangerouslySetInnerHTML={{ __html: htmlPreview }}
              />
              {/* 下载按钮组 */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button 
                  variant="outlined" 
                  onClick={handleDownloadHtml} 
                  sx={{ 
                    color: '#769164', 
                    borderColor: '#769164', 
                    '&:hover': { borderColor: '#5a7a4a', color: '#5a7a4a' } 
                  }}
                >
                  下载HTML代码
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={handleDownloadPng} 
                  sx={{ 
                    color: '#769164', 
                    borderColor: '#769164', 
                    '&:hover': { borderColor: '#5a7a4a', color: '#5a7a4a' } 
                  }}
                >
                  下载PNG图片
                </Button>
              </Box>
            </Box>
          </Paper>
        )}
        
        {/* 下载HTML代码按钮 - 独立放置 */}
        {result && !htmlPreview && (
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
            <Button 
              variant="outlined" 
              onClick={handleDownloadHtml} 
              sx={{ 
                color: '#769164', 
                borderColor: '#769164', 
                '&:hover': { borderColor: '#5a7a4a', color: '#5a7a4a' } 
              }}
            >
              下载HTML代码
            </Button>
          </Box>
        )}
      </Box>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={()=>setSnackbar({...snackbar,open:false})} message={snackbar.message} />
    </>
  );
} 