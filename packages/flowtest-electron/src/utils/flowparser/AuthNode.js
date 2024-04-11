const { Node } = require('./Node');

class AuthNode extends Node {
  constructor() {
    super('authNode');
  }

  serialize(id, data, metadata) {
    return {
      id,
      type: 'authNode',
      data,
      ...metadata,
    };
  }

  deserialize(node) {
    const id = node.id;
    const data = node.data;
    delete node.id;
    delete node.data;
    const metadata = node;

    return {
      id,
      data,
      metadata,
    };
  }
}

module.exports = {
  AuthNode,
};
