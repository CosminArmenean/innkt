# 🚀 MongoDB Local Installation Guide for Change Streams

## 📋 **Step-by-Step Installation**

### **1. Download MongoDB Community Edition**
1. Go to: **https://www.mongodb.com/try/download/community**
2. Select:
   - **Version**: 7.0 or later
   - **Platform**: Windows x64
   - **Package**: MSI
3. Click **Download**

### **2. Install MongoDB**
1. **Run the downloaded MSI file**
2. **Choose "Complete" installation**
3. **✅ Check "Install MongoDB as a Service"**
4. **✅ Check "Install MongoDB Compass"** (optional but helpful)
5. **Follow the installation wizard**

### **3. Verify Installation**
Open a **new PowerShell window** and run:
```powershell
mongod --version
```
You should see MongoDB version information.

### **4. Configure for Change Streams**

#### **A. Stop Docker MongoDB (avoid port conflicts)**
```powershell
docker stop innkt-mongodb-rs
```

#### **B. Create data directory**
```powershell
mkdir C:\data\db -Force
```

#### **C. Create MongoDB config file**
Create `C:\data\mongod.conf`:
```yaml
# MongoDB Configuration for Change Streams
storage:
  dbPath: C:\data\db
  journal:
    enabled: true

systemLog:
  destination: file
  path: C:\data\mongod.log
  logAppend: true

net:
  port: 27018
  bindIp: 127.0.0.1

replication:
  replSetName: "rs0"

setParameter:
  enableLocalhostAuthBypass: true
```

#### **D. Start MongoDB with replica set**
```powershell
mongod --config C:\data\mongod.conf
```

#### **E. Initialize replica set**
In a **new PowerShell window**:
```powershell
mongosh --port 27018 --eval "rs.initiate()"
```

#### **F. Verify replica set**
```powershell
mongosh --port 27018 --eval "rs.status()"
```
You should see `"stateStr": "PRIMARY"` and `"ok": 1`.

### **5. Update Your Application**

Update `Backend/innkt.Social/appsettings.json`:
```json
{
  "ConnectionStrings": {
    "MongoDB": "mongodb://127.0.0.1:27018/innkt_social?replicaSet=rs0"
  }
}
```

### **6. Restart Social Service**
```powershell
cd Backend/innkt.Social
dotnet run
```

## 🎯 **Expected Results**

You should see these **success messages**:
```
[INFO] Configuring MongoDB client for replica set: rs0 ✅
[INFO] Connected to MongoDB database: innkt_social ✅
[INFO] MongoDB connection test successful ✅
[INFO] Starting MongoDB Change Streams for real-time notifications ✅
[INFO] MongoDB Change Streams started successfully ✅
[INFO] Starting to monitor post changes ✅
[INFO] Starting to monitor poll vote changes ✅
```

**No more "replica sets" errors!** 🎉

## 🚀 **Benefits You'll Get**

- **⚡ Instant Updates**: <100ms real-time notifications
- **🔄 True Change Streams**: Zero polling, pure push notifications
- **📱 Live Social Features**: Instant likes, comments, poll results
- **🏗️ Production Architecture**: Same setup as MongoDB Atlas
- **🎯 Perfect UX**: Users see changes instantly

## 🛠️ **Alternative: Quick Test Setup**

If you want to test immediately without full installation:

### **Use MongoDB Portable**
1. Download MongoDB ZIP (not MSI)
2. Extract to `C:\mongodb`
3. Run: `C:\mongodb\bin\mongod --replSet rs0 --port 27018 --dbpath C:\data\db`
4. Initialize: `C:\mongodb\bin\mongosh --port 27018 --eval "rs.initiate()"`

## 🎊 **Ready for Change Streams!**

Once MongoDB is installed locally, you'll have a **true real-time social media platform** with instant updates that rivals Twitter, Instagram, and TikTok! 🚀

---

*Follow this guide and you'll have Change Streams working in 15 minutes!*
