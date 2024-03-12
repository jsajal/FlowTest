const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { ipcMain, shell, dialog, app } = require('electron');
const SwaggerParser = require('@apidevtools/swagger-parser');
const JsonRefs = require('json-refs');
const createDirectory = require('../utils/filemanager/createdirectory');
const deleteDirectory = require('../utils/filemanager/deletedirectory');
const uuidv4 = require('uuid').v4;
const Collections = require('../store/collection');
const parseOpenAPISpec = require('../utils/collection');
const { isDirectory, pathExists } = require('../utils/filemanager/filesystem');
const createFile = require('../utils/filemanager/createfile');
const updateFile = require('../utils/filemanager/updatefile');
const deleteFile = require('../utils/filemanager/deletefile');
const { flowDataToReadableData, readableDataToFlowData } = require('../utils/parser');
const readFile = require('../utils/filemanager/readfile');

const collectionStore = new Collections();

const timeout = 60000;

const newAbortSignal = () => {
  const abortController = new AbortController();
  setTimeout(() => abortController.abort(), timeout || 0);

  return abortController.signal;
};

/** web platform: blob. */
const convertBase64ToBlob = async (base64) => {
  const response = await fetch(base64);
  const blob = await response.blob();
  return blob;
};

const registerRendererEventHandlers = (mainWindow, watcher) => {
  ipcMain.handle('renderer:open-directory-selection-dialog', async (event, arg) => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
      });
      return result.filePaths[0];
    } catch (error) {
      return Promise.reject(error);
    }
  });

  ipcMain.handle('renderer:browser-window-ready', async (event) => {
    const savedCollections = collectionStore.getAll();

    for (let i = 0; i < savedCollections.length; i++) {
      if (isDirectory(savedCollections[i].pathname)) {
        mainWindow.webContents.send(
          'main:collection-created',
          savedCollections[i].id,
          path.basename(savedCollections[i].pathname),
          savedCollections[i].pathname,
          savedCollections[i].nodes,
        );

        watcher.addWatcher(mainWindow, savedCollections[i].pathname, savedCollections[i].id);
      } else {
        collectionStore.remove(savedCollections[i]);
      }
    }
  });

  ipcMain.handle('renderer:create-collection', async (event, openAPISpecFilePath, collectionFolderPath) => {
    try {
      const spec = fs.readFileSync(openAPISpecFilePath, 'utf8');
      // async/await syntax
      let api = await SwaggerParser.validate(openAPISpecFilePath);
      // console.log("API name: %s, Version: %s", api.info.title, api.info.version);

      // resolve references in openapi spec
      const resolvedSpec = await JsonRefs.resolveRefs(api);
      const parsedNodes = parseOpenAPISpec(resolvedSpec.resolved);

      const id = uuidv4();
      const collectionName = api.info.title;
      const pathname = path.join(collectionFolderPath, collectionName);

      const newCollection = {
        id: id,
        name: collectionName,
        pathname: pathname,
        collection: spec,
        nodes: parsedNodes,
      };

      const result = createDirectory(newCollection.name, collectionFolderPath);
      console.log(`Created directory: ${result}`);
      createDirectory('environments', pathname);

      mainWindow.webContents.send('main:collection-created', id, path.basename(pathname), pathname, parsedNodes);

      watcher.addWatcher(mainWindow, pathname, id);
      collectionStore.add(newCollection);
    } catch (error) {
      return Promise.reject(error);
    }
  });

  ipcMain.handle('renderer:delete-collection', async (event, collection) => {
    try {
      deleteDirectory(collection.pathname);
      console.log(`Deleted directory: ${collection.pathname}`);

      mainWindow.webContents.send('main:collection-deleted', collection.id);

      watcher.removeWatcher(collection.pathname);
      collectionStore.remove(collection);
    } catch (error) {
      return Promise.reject(error);
    }
  });

  ipcMain.handle('renderer:create-folder', async (event, name, path) => {
    try {
      const result = createDirectory(name, path);
      console.log(`Created directory: ${result}`);
    } catch (error) {
      return Promise.reject(error);
    }
  });

  ipcMain.handle('renderer:delete-folder', async (event, path) => {
    try {
      const result = deleteDirectory(path);
      console.log(`Deleted directory: ${path}`);
    } catch (error) {
      return Promise.reject(error);
    }
  });

  ipcMain.handle('renderer:create-environment', async (event, collectionPath, name) => {
    try {
      const envDir = path.join(collectionPath, 'environments');
      if (!isDirectory(envDir)) {
        createDirectory('environments', collectionPath);
      }
      const result = createFile(`${name}.env`, envDir, '');
      console.log(`Created file: ${name}.env`);
    } catch (error) {
      return Promise.reject(error);
    }
  });

  ipcMain.handle('renderer:update-environment', async (event, collectionPath, name, variables) => {
    try {
      const envDir = path.join(collectionPath, 'environments');
      updateFile(path.join(envDir, name), variables);
    } catch (error) {
      return Promise.reject(error);
    }
  });

  ipcMain.handle('renderer:delete-environment', async (event, collectionPath, name) => {
    try {
      const envDir = path.join(collectionPath, 'environments');
      deleteFile(path.join(envDir, `${name}.env`));
      console.log(`Delete file: ${name}.env`);
    } catch (error) {
      return Promise.reject(error);
    }
  });

  ipcMain.handle('renderer:create-flowtest', async (event, name, path, flowData) => {
    try {
      if (isDirectory(path)) {
        const readableData = flowData ? flowDataToReadableData(flowData) : {};
        createFile(`${name}.flow`, path, JSON.stringify(readableData, null, 4));
        console.log(`Created file: ${name}.flow`);
      }
    } catch (error) {
      return Promise.reject(error);
    }
  });

  ipcMain.handle('renderer:read-flowtest', async (event, pathname, collectionId) => {
    try {
      const content = readFile(pathname);
      const flowData = content === '{}' ? undefined : readableDataToFlowData(JSON.parse(content));
      mainWindow.webContents.send('main:read-flowtest', pathname, collectionId, flowData);
    } catch (error) {
      return Promise.reject(error);
    }
  });

  ipcMain.handle('renderer:update-flowtest', async (event, pathname, flowData) => {
    try {
      const readableData = flowDataToReadableData(flowData);
      updateFile(pathname, JSON.stringify(readableData, null, 4));
      console.log(`Updated file: ${pathname}`);
    } catch (error) {
      return Promise.reject(error);
    }
  });

  ipcMain.handle('renderer:delete-flowtest', async (event, pathname) => {
    try {
      deleteFile(pathname);
      console.log(`Delete file: ${pathname}`);
    } catch (error) {
      return Promise.reject(error);
    }
  });

  ipcMain.handle('renderer:run-http-request', async (event, request) => {
    try {
      if (request.headers['Content-type'] === 'multipart/form-data') {
        const requestData = new FormData();
        const file = await convertBase64ToBlob(request.data.value);
        requestData.append(request.data.key, file, request.data.name);

        request.data = requestData;
      }

      // assuming 'application/json' type
      const options = {
        ...request,
        signal: newAbortSignal(),
      };

      const result = await axios(options);
      return {
        status: result.status,
        statusText: result.statusText,
        data: result.data,
      };
    } catch (error) {
      if (error?.response) {
        return {
          error: {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
          },
        };
      } else {
        return {
          error: {
            message: 'An unknown error occurred while running the request',
          },
        };
      }
    }
  });
};

module.exports = registerRendererEventHandlers;
