const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const { promisify } = require("util");

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const SKILL_EXPERIMENTAL_REFACTORIZADO =
  "skill-experimental-refactorizado.json";
const FILE_FROM = "skill-experimental-refactorizado.json"; //colocar nombre de skill origen (JSON)
const FILE_TO = "simpleeSeguros.json"; //colocar nombre de skill objetivo (JSON)
const FOLDER_NAME_FROM = "Skill Base"; //colocar nombre de folder origen
const FOLDER_NAME_TO = "Skill Base"; //colocar nombre de folder destino

(async () => {
  let skillFrom = await readSkill(FILE_FROM);
  let skillTo = await readSkill(FILE_TO);
  // refactorTreeNodes(skillFrom); //refactorizar los ids del skill base experimental
  // let nodeIdFrom = getNodeId(skillFrom, FOLDER_NAME_FROM);
  // let nodeIdTo = getNodeId(skillTo, FOLDER_NAME_TO);
  // //asignando id de folder origen a folder objetivo
  // await updateSkillBaseFolderId(skillFrom, skillTo, FOLDER_NAME_TO);
  // //vaciando folder Skill Base del Skill Objetivo
  // await deleteChildsRecursivelyById(skillTo, nodeIdTo, FOLDER_NAME_TO);
  // //copiando folder de skill origen a skill objetivo
  // await copyNodeRecursivelyById(
  //   skillFrom,
  //   nodeIdFrom,
  //   FOLDER_NAME_FROM,
  //   skillTo
  // );
  // //agregar intents y entities faltantes
  await addMissingIntentsAndEntities(skillFrom, skillTo);
  //actualizar metadata
  await updateMetadata(skillTo);
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

async function updateSkillBaseFolderId(skillFrom, skillTo, nodeName) {
  let toDialogNodes = skillTo.dialog_nodes;
  let fromFolderId = getNodeId(skillFrom, nodeName);
  let toFolderId = getNodeId(skillTo, nodeName);
  for (const dialogNode of toDialogNodes) {
    if (dialogNode.dialog_node === toFolderId)
      dialogNode.dialog_node = fromFolderId;
    if (dialogNode.previous_sibling === toFolderId) {
      console.log("se actualizo previo...", fromFolderId);
      dialogNode.previous_sibling = fromFolderId;
    }
  }
  //guardando cambios
  json = JSON.stringify(skillTo); //convert it back to json
  await writeFileAsync(FILE_TO, json, "utf8");
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

async function refactorTreeNodes(skill) {
  //actualiza los ids del skill experimental (origen)
  let dialogNodes = skill.dialog_nodes;
  for (const dialogNode of dialogNodes) {
    let nodeId = dialogNode.dialog_node;
    let newNodeId = uuidv4();
    //leyendo
    let rawdata = JSON.stringify(
      await readSkill(SKILL_EXPERIMENTAL_REFACTORIZADO)
    );
    var re = new RegExp(nodeId, "g");
    const newRawData = rawdata.replace(re, newNodeId);
    // actualizando
    await writeFileAsync(SKILL_EXPERIMENTAL_REFACTORIZADO, newRawData, "utf8");
  }
  // return skill;
}

async function addMissingIntentsAndEntities(skillFrom, skillTo) {
  let fromIntents = skillFrom.intents;
  let fromEntities = skillFrom.entities;
  let toIntents = skillTo.intents;
  let toEntities = skillTo.entities;
  for (const fromIntent of fromIntents) {
    if (
      toIntents.findIndex(
        (toIntent) => toIntent.intent === fromIntent.intent
      ) == -1
    ) {
      //no se encontro y se debe agregar intent
      console.log("agregando intent:", fromIntent.intent);
      skillTo.intents.push(fromIntent);
    }
  }
  for (const fromEntity of fromEntities) {
    if (
      toEntities.findIndex(
        (toEntity) => toEntity.entity === fromEntity.entity
      ) == -1
    ) {
      //no se encontro y se debe agregar entity
      console.log("agregando entity:", fromEntity.entity);
      skillTo.entities.push(fromEntity);
    }
  }
  json = JSON.stringify(skillTo); //convert it back to json
  await writeFileAsync(FILE_TO, json, "utf8");
}

async function updateMetadata(skillTo) {
  let metadata = skillTo.metadata;
  metadata.skill.counts.intents = skillTo.intents.length;
  metadata.skill.counts.entities = skillTo.entities.length;
  metadata.skill.counts.dialog_nodes = skillTo.dialog_nodes.length;
  json = JSON.stringify(skillTo); //convert it back to json
  await writeFileAsync(FILE_TO, json, "utf8");
  console.log("metadata actualizada!");
}
