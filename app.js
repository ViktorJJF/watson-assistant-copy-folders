const fs = require("fs");
const { promisify } = require("util");

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const FILE_TO = "skill_to.json"; //colocar nombre de skill objetivo (JSON)
const FILE_FROM = "skill_from.json"; //colocar nombre de skill origen (JSON)
const FOLDER_NAME_FROM = "Skill Base"; //colocar nombre de folder origen
const FOLDER_NAME_TO = "Skill Base"; //colocar nombre de folder destino

(async () => {
  let skillFrom = await readSkill(FILE_FROM);
  let skillTo = await readSkill(FILE_TO);
  let nodeIdFrom = getNodeId(skillFrom, FOLDER_NAME_FROM);
  let nodeIdTo = getNodeId(skillTo, FOLDER_NAME_TO);
  //vaciando folder Skill Base del Skill Objetivo
  await deleteChildsRecursivelyById(skillTo, nodeIdTo, FOLDER_NAME_TO);
  //copiando folder de skill origen a skill objetivo
  await copyNodeRecursivelyById(
    skillFrom,
    nodeIdFrom,
    FOLDER_NAME_FROM,
    skillTo
  );
  console.log("HECHO!");
})();

async function readSkill(filename) {
  let rawdata = await readFileAsync(filename);
  let data = JSON.parse(rawdata);
  return data;
}

function getFolders(skill) {
  let dialogNodes = skill.dialog_nodes;
  dialogNodes.forEach((dialogNode) => {
    if (dialogNode.type === "folder") {
      console.log("Folder: ", dialogNode.title);
    }
  });
}

function getFolderNodes(skill, folderName) {
  let dialogNodes = skill.dialog_nodes;
  let folderId = dialogNodes.find(
    (dialogNode) => dialogNode.title === folderName
  ).dialog_node;
  let nodes = [];
  dialogNodes.forEach((dialogNode) => {
    if (dialogNode.parent === folderId) {
      nodes.push(dialogNode);
    }
  });
  return nodes;
}

function getChildren(skill, nodeName) {
  let dialogNodes = skill.dialog_nodes;
  let nodeId = dialogNodes.find((dialogNode) => dialogNode.title === nodeName)
    .dialog_node;
  let nodes = dialogNodes.filter((dialogNode) => dialogNode.parent === nodeId);
  return nodes;
}

function getChilsdById(skill, nodeId) {
  let dialogNodes = skill.dialog_nodes;
  let nodes = dialogNodes.filter((dialogNode) => dialogNode.parent === nodeId);
  return nodes;
}

async function deleteChildsRecursivelyById(skill, nodeId, firstParentName) {
  let childs = getChilsdById(skill, nodeId);
  if (childs.length > 0) {
    for (const child of childs) {
      await deleteChildsRecursivelyById(skill, child.dialog_node);
    }
    if (!firstParentName) {
      console.log("eliminando al padre...", nodeId);
      await deleteNodeInFile(skill, nodeId);
    }
  } else {
    console.log("eliminando nodo hijo: ", nodeId);
    if (!firstParentName) await deleteNodeInFile(skill, nodeId);
  }
}

async function deleteNodeInFile(skill, nodeId) {
  let dialogNodes = skill.dialog_nodes;
  let nodeIndex = dialogNodes.findIndex(
    (dialogNode) => dialogNode.dialog_node === nodeId
  );
  if (nodeIndex > -1) {
    dialogNodes.splice(nodeIndex, 1);
    json = JSON.stringify(skill); //convert it back to json
    await writeFileAsync(FILE_TO, json, "utf8");
  }
}

async function addNodeInFile(skill, node) {
  let dialogNodes = skill.dialog_nodes;
  dialogNodes.push(node);
  json = JSON.stringify(skill); //convert it back to json
  await writeFileAsync(FILE_TO, json, "utf8");
}

function getNodeId(skill, nodeName) {
  let dialogNodes = skill.dialog_nodes;
  let node = dialogNodes.find((dialogNode) => dialogNode.title === nodeName);
  console.log("el id: ", node ? node.dialog_node : null);
  return node ? node.dialog_node : null;
}

async function getChildrenRecursivelyById(skill, nodeId, firstParentName) {
  let children = getChilsdById(skill, nodeId);
  if (children.length > 0) {
    for (const child of children) {
      await getChildrenRecursivelyById(skill, child.dialog_node);
    }
    if (!firstParentName) {
      console.log("nodo padre...", nodeId);
    }
  } else {
    console.log("nodo hijo: ", nodeId);
  }
}

async function copyNodeRecursivelyById(
  skillFrom,
  nodeIdFrom,
  firstParentName,
  skillTo
) {
  let node;
  let children = getChilsdById(skillFrom, nodeIdFrom);
  if (children.length > 0) {
    for (const child of children) {
      await copyNodeRecursivelyById(
        skillFrom,
        child.dialog_node,
        null,
        skillTo
      );
    }
    if (!firstParentName) {
      console.log("nodo padre...", nodeIdFrom);
      node = getNodeById(skillFrom, nodeIdFrom);
      await addNodeInFile(skillTo, node);
    }
  } else {
    console.log("nodo hijo: ", nodeIdFrom);
    node = getNodeById(skillFrom, nodeIdFrom);
    await addNodeInFile(skillTo, node);
  }
}

function getNodeById(skill, nodeId) {
  let dialogNodes = skill.dialog_nodes;
  let node = dialogNodes.find(
    (dialogNode) => dialogNode.dialog_node === nodeId
  );
  return node;
}
