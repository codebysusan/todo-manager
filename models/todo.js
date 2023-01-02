"use strict";
const { Model, Op } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    // eslint-disable-next-line no-unused-vars
    static associate(models) {
      Todo.belongsTo(models.User, {
        foreignKey: "userId",
      });
      // define association here
    }

    static addTodo({ title, dueDate }) {
      return this.create({ title: title, dueDate: dueDate, completed: false });
    }

    markAsCompleted() {
      return this.update({ completed: true });
    }

    setCompletionStatus(x) {
      return this.update({ completed: x });
    }

    static remove(id) {
      return this.destroy({
        where: {
          id,
        },
      });
    }

    static getOverdue() {
      return this.findAll({
        where: {
          dueDate: {
            [Op.lt]: new Date().toISOString(),
          },
          completed: false,
        },
        order: [["id", "ASC"]],
      });
    }
    static getDuetoday() {
      return this.findAll({
        where: {
          dueDate: {
            [Op.eq]: new Date().toISOString(),
          },
          completed: false,
        },
        order: [["id", "ASC"]],
      });
    }
    static getDuelater() {
      return this.findAll({
        where: {
          dueDate: {
            [Op.gt]: new Date().toISOString(),
          },
          completed: false,
        },
        order: [["id", "ASC"]],
      });
    }

    static getCompleted() {
      return this.findAll({
        where: {
          completed: true,
        },
        order: [["id", "ASC"]],
      });
    }

    static getTodos() {
      return this.findAll();
    }
  }
  Todo.init(
    {
      title: DataTypes.STRING,
      dueDate: DataTypes.DATEONLY,
      completed: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Todo",
    }
  );
  return Todo;
};
