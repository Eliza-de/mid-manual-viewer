/**
 * Ant Design v5 theme — medical tech aesthetic
 * Aligns with Vibharam DoctorSmart visual language
 */

export const antdTheme = {
  token: {
    colorPrimary: '#1e3a5f',       // deep medical navy
    colorInfo: '#0ea5e9',
    colorSuccess: '#10b981',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',

    colorBgBase: '#ffffff',
    colorBgLayout: '#f5f7fa',
    colorBgContainer: '#ffffff',
    colorTextBase: '#1f2937',

    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Sukhumvit Set", "IBM Plex Sans Thai", sans-serif',
    fontSize: 14,

    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,

    wireframe: false
  },
  components: {
    Button: {
      controlHeight: 40,
      fontWeight: 500
    },
    Card: {
      paddingLG: 16
    },
    Input: {
      controlHeight: 40
    },
    Tag: {
      fontSize: 12
    }
  }
};
