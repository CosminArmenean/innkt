# 📦 Translation Dependencies Installation Guide

## Quick Install Commands

### **React Frontend**
```bash
cd Frontend/innkt.react
npm install i18next react-i18next i18next-http-backend i18next-browser-languagedetector
```

### **Node.js Messaging Service**
```bash
cd Backend/innkt.Messaging
npm install i18next i18next-http-middleware i18next-fs-backend
```

### **React Native Mobile**
```bash
cd Mobile/innkt.Mobile
npm install i18next react-i18next
```

## Verification

After installation, verify packages:

```bash
# React
cd Frontend/innkt.react && npm list | grep i18next

# Messaging
cd Backend/innkt.Messaging && npm list | grep i18next

# Mobile
cd Mobile/innkt.Mobile && npm list | grep i18next
```

## Expected Versions

- **i18next**: ^23.0.0
- **react-i18next**: ^14.0.0
- **i18next-http-backend**: ^2.0.0
- **i18next-browser-languagedetector**: ^7.0.0
- **i18next-http-middleware**: ^3.0.0
- **i18next-fs-backend**: ^2.0.0
