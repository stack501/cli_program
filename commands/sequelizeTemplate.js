/**
 * Sequelize 모델 코드를 생성하는 함수
 * @param {string} modelName - 모델 이름 (대문자 첫 글자 권장)
 * @param {Array} columns - 컬럼 정보 배열 [{ name, type, allowNull, defaultValue, ... }]
 * @param {Object} sequelizeOptions - 시퀄라이즈 설정 (timestamps, paranoid, tableName, charset, collate 등)
 * @param {Array} associations - 연관관계 정보 배열 (예: [{ type: 'belongsTo', target: 'User' }, ...])
 * @returns {string} - 생성된 모델 코드 문자열
 */
function generateModelCode(modelName, columns, sequelizeOptions, associations) {
    // 컬럼 정의 문자열 생성 (들여쓰기는 12칸까지 사용)
    let columnsString = columns
      .map(col => {
        let opts = [];
        opts.push(`type: Sequelize.${col.type.toUpperCase()}`);
        opts.push(`allowNull: ${col.allowNull}`);
        if (col.defaultValue !== '') {
          opts.push(`defaultValue: ${col.defaultValue}`);
        }
        return `            ${col.name}: {\n                ${opts.join(',\n                ')}\n            }`;
      })
      .join(',\n');
  
    // Sequelize 옵션 문자열 (init()의 두 번째 인자, 들여쓰기는 12칸)
    let sequelizeOptsString = [
      `sequelize,`,
      `timestamps: ${sequelizeOptions.timestamps},`,
      `paranoid: ${sequelizeOptions.paranoid},`,
      `modelName: '${modelName}',`,
      `tableName: '${sequelizeOptions.tableName}',`,
      `charset: '${sequelizeOptions.charset}',`,
      `collate: '${sequelizeOptions.collate}',`
    ].join('\n                ');
  
    // 기본 모델 코드 템플릿 (클래스 선언 위의 불필요한 빈 줄 제거)
    let code = `const Sequelize = require('sequelize');
  
class ${modelName} extends Sequelize.Model {
    static initiate(sequelize) {
        ${modelName}.init({
${columnsString}
        }, {
                ${sequelizeOptsString}
        });
    }
    
    static associate(db) {
`;
// 연관관계 문자열 추가 (들여쓰기는 8칸)
associations.forEach(assoc => {
    code += `        db.${modelName}.${assoc.type}(db.${assoc.target});\n`;
});

code += `    }
}

module.exports = ${modelName};
`;
    return code;
}
  
const indexTemplate = `const Sequelize = require('sequelize');
  const { loadModels } = require('../lib/sequelize-loader');
  
  const env = process.env.NODE_ENV || 'development';
  const config = require('../config/config.json')[env];
  const sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );
  
  const db = loadModels(sequelize, __dirname);
  db.sequelize = sequelize;
  
  module.exports = db;
`;

const sequelizeLoaderTemplate = `
const fs = require('fs');
const path = require('path');

/**
 * Sequelize 모델을 스캔하고 초기화 후 반환하는 함수
 * @param {Object} sequelize - Sequelize 인스턴스
 * @param {String} modelsPath - 모델들이 위치한 디렉토리 경로
 * @returns {Object} 초기화된 db 객체
 */
function loadModels(sequelize, modelsPath) {
    const db = {};
    const basename = path.basename(__filename); //index.js

    fs.readdirSync(modelsPath)
        .filter(file => {
        //file.index('.') 은 숨기파일 제외 (.env같은 파일이 숨김파일)
        //index.js 제외
        //파일의 마지막 세자리가 .js 인 경우만 (js파일인 경우만)
        return (
            file.indexOf('.') !== 0 
            && file !== basename 
            && file !== 'index.js'
            && file.slice(-3) === '.js');
        })
        .forEach((file) => {
            const model = require(path.join(modelsPath, file));
            console.log(file, model.name);
            db[model.name] = model;
            model.initiate(sequelize);
        });

    Object.keys(db).forEach(modelName => {
        console.log(db, modelName);
        if (db[modelName].associate){
            db[modelName].associate(db);
        }
    });

    return db;
}

module.exports = {
    loadModels,
}
`
  
module.exports = {
    generateModelCode,
    indexTemplate,
    sequelizeLoaderTemplate
};