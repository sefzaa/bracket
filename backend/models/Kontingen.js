// backend/models/Kontingen.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Kontingen = sequelize.define('Kontingen', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nama_kontingen: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  kabupaten: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  provinsi: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'kontingen',
  timestamps: true,
});

module.exports = Kontingen;