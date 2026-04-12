const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event) => {
  const { fileID } = event;
  const res = await cloud.getTempFileURL({ fileList: [fileID] });
  if (res.fileList && res.fileList[0] && res.fileList[0].tempFileURL) {
    return { url: res.fileList[0].tempFileURL };
  }
  return { url: "", errMsg: res.fileList[0].errMsg };
};
