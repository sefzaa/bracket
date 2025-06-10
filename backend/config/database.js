const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('bracket', 'root', null, {
  host: 'localhost',
  dialect: 'mysql',
});

module.exports = sequelize;
