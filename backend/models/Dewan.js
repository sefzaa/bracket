// backend/models/Dewan.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Dewan = sequelize.define('Dewan', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nama: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // lisensi: {
  //   type: DataTypes.STRING,
  //   allowNull: true,
  // }
}, {
  tableName: 'dewan',
  timestamps: true,
});

module.exports = Dewan;