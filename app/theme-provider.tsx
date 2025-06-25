'use client';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#769164',
      light: '#e6ede3',
      dark: '#5a7a4a',
      contrastText: '#fff',
    },
    secondary: {
      main: '#769164',
      light: '#e6ede3',
      dark: '#5a7a4a',
      contrastText: '#fff',
    },
  },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#769164',
          },
        },
        notchedOutline: {
          borderColor: '#769164',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          '&.Mui-focused': {
            color: '#769164',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        icon: {
          color: '#769164',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: '#e6ede3',
            color: '#769164',
          },
          '&.Mui-selected:hover': {
            backgroundColor: '#d2e0c7',
            color: '#769164',
          },
          '&:hover': {
            backgroundColor: '#e6ede3',
            color: '#769164',
          },
        },
      },
    },
  },
});

export default function MuiThemeProvider({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
} 