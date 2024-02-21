const Store = require('electron-store');
const { isDirectory } = require('../utils/filemanager/filesystem');

class Collections {
  constructor() {
    this.store = new Store();
  }

  add(collection) {
    const collections = this.store.get('collections') || [];

    if (isDirectory(collection.pathname)) {
      if (!collections.find((c) => c.pathname === collection.pathname)) {
        collections.push(collection);
        this.store.set('collections', collections);
      }
    }
  }

  remove(collection) {
    const collections = this.store.get('collections') || [];

    if (!isDirectory(collection.pathname)) {
      this.store.set(
        'collections',
        collections.filter((c) => c.id !== collection.id),
      );
    }
  }
}

module.exports = Collections;
