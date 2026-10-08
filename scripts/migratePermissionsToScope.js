// scripts/migratePermissionsToScope.js
const Permission = require("../modal/permissionSchema");

const migrate = async () => {
  const docs = await Permission.find();

  for (const doc of docs) {
    let changed = false;

    doc.permissions = doc.permissions.map((p) => {
      const obj = p.toObject ? p.toObject() : p;
      const converted = { module: obj.module };

      ["view", "create", "update", "status", "delete"].forEach((action) => {
        const val = obj[action];
        if (typeof val === "boolean") {
          converted[action] = val ? "all" : "none";
          changed = true;
        } else {
          converted[action] = val; // already migrated
        }
      });

      return converted;
    });

    if (changed) {
      await doc.save();
      console.log(`Migrated permissions for role: ${doc.role}`);
    }
  }
};

module.exports = migrate;