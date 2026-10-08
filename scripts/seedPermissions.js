const Permission = require("../modal/permissionSchema");
const MODULES = require("../constants/module");

const buildBlankPermissions = () =>
  MODULES.map((m) => ({
    module: m,
    view: "none",
    create: "none",
    update: "none",
    status: "none",
    delete: "none",
  }));

const seedPermissions = async () => {
  for (const role of ["admin", "staff"]) {
    const exists = await Permission.findOne({ role });
    if (!exists) {
      await Permission.create({ role, permissions: buildBlankPermissions() });
      console.log(`Seeded permissions for ${role}`);
    }
  }
};

module.exports = seedPermissions;