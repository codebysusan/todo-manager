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

    static addTodo({ title, dueDate, userId }) {
      return this.create({
        title: title,
        dueDate: dueDate,
        completed: false,
        userId,
      });
    }

    markAsCompleted() {
      return this.update({ completed: true });
    }

    setCompletionStatus(completed) {
      return this.update({ completed });
    }

    static remove(id, userId) {
      return this.destroy({
        where: {
          id,
          userId,
        },
      });
    }

    static getOverdue(userId) {
      return this.findAll({
        where: {
          dueDate: {
            [Op.lt]: new Date().toISOString(),
          },
          completed: false,
          userId,
        },
        order: [["id", "ASC"]],
      });
    }
    static getDuetoday(userId) {
      return this.findAll({
        where: {
          dueDate: {
            [Op.eq]: new Date().toISOString(),
          },
          completed: false,
          userId,
        },
        order: [["id", "ASC"]],
      });
    }
    static getDuelater(userId) {
      return this.findAll({
        where: {
          dueDate: {
            [Op.gt]: new Date().toISOString(),
          },
          completed: false,
          userId,
        },
        order: [["id", "ASC"]],
      });
    }

    static getCompleted(userId) {
      return this.findAll({
        where: {
          completed: true,
          userId,
        },
      });
    }

    static getTodos() {
      return this.findAll();
    }
  }
  Todo.init(
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: true,
          len: 5,
        },
      },
      dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          notNull: true,
        },
      },
      completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "Todo",
    }
  );
  return Todo;
};
