'use client';

import { createTheme, ThemeOptions } from '@mui/material/styles';
import { Redressed, Inter } from 'next/font/google';

// Font configurations
const redressed = Redressed({ subsets: ['latin'], weight: ['400'] });
const inter = Inter({ subsets: ['latin'] });

// Professional color palette preserving brand identity
const colorPalette = {
  primary: {
    50: '#f8fafc', // slate-50
    100: '#f1f5f9', // slate-100
    200: '#e2e8f0', // slate-200
    300: '#cbd5e1', // slate-300
    400: '#94a3b8', // slate-400
    500: '#64748b', // slate-500
    600: '#475569', // slate-600 (main)
    700: '#334155', // slate-700
    800: '#1e293b', // slate-800
    900: '#0f172a' // slate-900
  },
  secondary: {
    50: '#eff6ff', // blue-50
    100: '#dbeafe', // blue-100
    200: '#bfdbfe', // blue-200
    300: '#93c5fd', // blue-300
    400: '#60a5fa', // blue-400
    500: '#3b82f6', // blue-500
    600: '#2563eb', // blue-600 (main)
    700: '#1d4ed8', // blue-700
    800: '#1e40af', // blue-800
    900: '#1e3a8a' // blue-900
  },
  success: {
    50: '#f0fdf4', // green-50
    100: '#dcfce7', // green-100
    200: '#bbf7d0', // green-200
    300: '#86efac', // green-300
    400: '#4ade80', // green-400
    500: '#22c55e', // green-500
    600: '#16a34a', // green-600 (main)
    700: '#15803d', // green-700
    800: '#166534', // green-800
    900: '#14532d' // green-900
  },
  warning: {
    50: '#fff7ed', // orange-50
    100: '#ffedd5', // orange-100
    200: '#fed7aa', // orange-200
    300: '#fdba74', // orange-300
    400: '#fb923c', // orange-400
    500: '#f97316', // orange-500
    600: '#ea580c', // orange-600 (main)
    700: '#c2410c', // orange-700
    800: '#9a3412', // orange-800
    900: '#7c2d12' // orange-900
  },
  error: {
    50: '#fef2f2', // red-50
    100: '#fee2e2', // red-100
    200: '#fecaca', // red-200
    300: '#fca5a5', // red-300
    400: '#f87171', // red-400
    500: '#ef4444', // red-500
    600: '#dc2626', // red-600 (main)
    700: '#b91c1c', // red-700
    800: '#991b1b', // red-800
    900: '#7f1d1d' // red-900
  },
  grey: {
    50: '#f9fafb', // gray-50
    100: '#f3f4f6', // gray-100
    200: '#e5e7eb', // gray-200
    300: '#d1d5db', // gray-300
    400: '#9ca3af', // gray-400
    500: '#6b7280', // gray-500
    600: '#4b5563', // gray-600
    700: '#374151', // gray-700
    800: '#1f2937', // gray-800
    900: '#111827' // gray-900
  }
};

// Professional theme configuration
const themeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: colorPalette.primary[600],
      light: colorPalette.primary[500],
      dark: colorPalette.primary[700],
      contrastText: '#ffffff'
    },
    secondary: {
      main: colorPalette.secondary[600],
      light: colorPalette.secondary[500],
      dark: colorPalette.secondary[700],
      contrastText: '#ffffff'
    },
    success: {
      main: colorPalette.success[600],
      light: colorPalette.success[500],
      dark: colorPalette.success[700],
      contrastText: '#ffffff'
    },
    warning: {
      main: colorPalette.warning[600],
      light: colorPalette.warning[500],
      dark: colorPalette.warning[700],
      contrastText: '#ffffff'
    },
    error: {
      main: colorPalette.error[600],
      light: colorPalette.error[500],
      dark: colorPalette.error[700],
      contrastText: '#ffffff'
    },
    grey: colorPalette.grey,
    background: {
      default: '#ffffff', // slate-50
      paper: '#ffffff'
    },
    text: {
      primary: colorPalette.primary[700], // slate-700
      secondary: colorPalette.grey[600], // gray-600
      disabled: colorPalette.grey[400] // gray-400
    },
    divider: colorPalette.grey[200] // gray-200
  },
  typography: {
    fontFamily: `"SF Pro Display", ${inter.style.fontFamily}, Arial, sans-serif`,
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.025em'
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.025em'
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '-0.025em'
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '-0.025em'
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.5
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.6
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.6
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.5,
      color: colorPalette.grey[600]
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 600,
      lineHeight: 1.5,
      textTransform: 'uppercase',
      letterSpacing: '0.1em'
    }
  },
  spacing: 8, // 8px base unit
  shape: {
    borderRadius: 8 // Consistent with current rounded-lg
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 640, // Tailwind sm
      md: 768, // Tailwind md
      lg: 1024, // Tailwind lg
      xl: 1280 // Tailwind xl
    }
  },
  shadows: [
    'none',
    '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)', // elevation 1
    '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)', // elevation 2
    '0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)', // elevation 3
    '0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)', // elevation 4
    '0 19px 38px rgba(0, 0, 0, 0.30), 0 15px 12px rgba(0, 0, 0, 0.22)', // elevation 5
    '0 19px 38px rgba(0, 0, 0, 0.30), 0 15px 12px rgba(0, 0, 0, 0.22)', // elevation 6
    '0 19px 38px rgba(0, 0, 0, 0.30), 0 15px 12px rgba(0, 0, 0, 0.22)', // elevation 7
    '0 19px 38px rgba(0, 0, 0, 0.30), 0 15px 12px rgba(0, 0, 0, 0.22)', // elevation 8
    '0 19px 38px rgba(0, 0, 0, 0.30), 0 15px 12px rgba(0, 0, 0, 0.22)', // elevation 9
    '0 19px 38px rgba(0, 0, 0, 0.30), 0 15px 12px rgba(0, 0, 0, 0.22)', // elevation 10
    '0 19px 38px rgba(0, 0, 0, 0.30), 0 15px 12px rgba(0, 0, 0, 0.22)', // elevation 11
    '0 19px 38px rgba(0, 0, 0, 0.30), 0 15px 12px rgba(0, 0, 0, 0.22)', // elevation 12
    '0 19px 38px rgba(0, 0, 0, 0.30), 0 15px 12px rgba(0, 0, 0, 0.22)', // elevation 13
    '0 19px 38px rgba(0, 0, 0, 0.30), 0 15px 12px rgba(0, 0, 0, 0.22)', // elevation 14
    '0 19px 38px rgba(0, 0, 0, 0.30), 0 15px 12px rgba(0, 0, 0, 0.22)', // elevation 15
    '0 19px 38px rgba(0, 0, 0, 0.30), 0 15px 12px rgba(0, 0, 0, 0.22)', // elevation 16
    '0 19px 38px rgba(0, 0, 0, 0.30), 0 15px 12px rgba(0, 0, 0, 0.22)', // elevation 17
    '0 19px 38px rgba(0, 0, 0, 0.30), 0 15px 12px rgba(0, 0, 0, 0.22)', // elevation 18
    '0 19px 38px rgba(0, 0, 0, 0.30), 0 15px 12px rgba(0, 0, 0, 0.22)', // elevation 19
    '0 19px 38px rgba(0, 0, 0, 0.30), 0 15px 12px rgba(0, 0, 0, 0.22)', // elevation 20
    '0 19px 38px rgba(0, 0, 0, 0.30), 0 15px 12px rgba(0, 0, 0, 0.22)', // elevation 21
    '0 19px 38px rgba(0, 0, 0, 0.30), 0 15px 12px rgba(0, 0, 0, 0.22)', // elevation 22
    '0 19px 38px rgba(0, 0, 0, 0.30), 0 15px 12px rgba(0, 0, 0, 0.22)', // elevation 23
    '0 19px 38px rgba(0, 0, 0, 0.30), 0 15px 12px rgba(0, 0, 0, 0.22)' // elevation 24
  ]
};

// Enhanced theme with custom component overrides
const adminTheme = createTheme({
  ...themeOptions,
  components: {
    // Card component - replacing hand-coded cards
    MuiCard: {
      styleOverrides: {
        root: {
          border: `1px solid ${colorPalette.grey[200]}`,
          boxShadow: 'none', // Consistent with current design
          borderRadius: 8,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: colorPalette.grey[300]
          }
        }
      }
    },

    // Button component - professional styling
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 6,
          fontWeight: 500,
          fontSize: '0.875rem',
          padding: '8px 16px',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)'
          }
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.12)'
          }
        },
        outlined: {
          borderWidth: '1px',
          '&:hover': {
            borderWidth: '1px'
          }
        }
      }
    },

    // Drawer component - for sidebar
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: colorPalette.primary[200], // slate-200
          borderRight: 'none',
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)'
        }
      }
    },

    // List components - for navigation
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          margin: '4px 8px',
          padding: '12px 16px',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: colorPalette.primary[500], // slate-500
            color: '#ffffff'
          },
          '&.Mui-selected': {
            backgroundColor: colorPalette.primary[500], // slate-500
            color: '#ffffff',
            '&:hover': {
              backgroundColor: colorPalette.primary[600] // slate-600
            }
          }
        }
      }
    },

    // AppBar component - for top navigation
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: colorPalette.primary[200], // slate-200
          color: colorPalette.primary[700], // slate-700
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
          borderBottom: `1px solid ${colorPalette.grey[200]}`
        }
      }
    },

    // Paper component - for containers
    MuiPaper: {
      styleOverrides: {
        root: {
          border: `1px solid ${colorPalette.grey[200]}`,
          boxShadow: 'none'
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)'
        }
      }
    },

    // TextField component - for forms
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 6,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: colorPalette.primary[400]
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: colorPalette.secondary[600],
              borderWidth: '2px'
            }
          }
        }
      }
    },

    // Chip component - for tags and status
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500
        }
      }
    },

    // Dialog component - for modals
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }
      }
    }

    // DataGrid component - for tables (will be added when @mui/x-data-grid is installed)
    // MuiDataGrid: {
    //   styleOverrides: {
    //     root: {
    //       border: `1px solid ${colorPalette.grey[200]}`,
    //       borderRadius: 8,
    //       '& .MuiDataGrid-cell': {
    //         borderBottom: `1px solid ${colorPalette.grey[100]}`
    //       },
    //       '& .MuiDataGrid-columnHeaders': {
    //         backgroundColor: colorPalette.grey[50],
    //         borderBottom: `1px solid ${colorPalette.grey[200]}`
    //       }
    //     }
    //   }
    // }
  }
});

// Export the complete theme
export { adminTheme };

// Export color palette for use in components
export { colorPalette };

// Export brand fonts for special use cases
export { redressed, inter };
