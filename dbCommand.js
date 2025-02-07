#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const inquirer = require('inquirer').default;
const chalk = require('chalk').default;

const { generateModelCode, indexTemplate, sequelizeLoaderTemplate } = require('./commands/sequelizeTemplate');

// 모델 파일이 생성될 디렉토리 (예: models 폴더)
const MODELS_DIR = path.join(process.cwd(), 'models');
const LIB_DIR = path.join(process.cwd(), 'lib');

// Commander 설정
program
  .version('0.0.1')
  .description('Sequelize 모델 생성 CLI 도구');

program
  .command('model')
  .description('새로운 Sequelize 모델 파일을 생성합니다.')
  .action(async () => {
    try {
      // 1. 모델 이름 입력
      const { modelName } = await inquirer.prompt([
        {
          type: 'input',
          name: 'modelName',
          message: '모델 이름을 입력하세요 (예: Auction)',
          validate: input => input ? true : '모델 이름은 필수입니다.'
        }
      ]);

      // 2. 컬럼 입력 (여러 컬럼을 추가할 수 있도록 반복)
      let columns = [];
      let addMoreColumns = true;
      while (addMoreColumns) {
        const col = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: '컬럼 이름을 입력하세요 (예: bid)',
            validate: input => input ? true : '컬럼 이름은 필수입니다.'
          },
          {
            type: 'list',
            name: 'type',
            message: '컬럼 타입을 선택하세요',
            choices: [
              'INTEGER',
              'STRING',
              'TEXT',
              'FLOAT',
              'DOUBLE',
              'DECIMAL',
              'DATE',
              'BOOLEAN',
              'JSON',
              'UUID',
              'NOW',
              'DATEONLY',
              'TIME'
            ]
          },
          {
            type: 'confirm',
            name: 'allowNull',
            message: 'NULL 허용할까요?',
            default: false
          },
          {
            type: 'input',
            name: 'defaultValue',
            message: '기본값 (없으면 빈 문자열로 두세요)',
            default: ''
          }
        ]);

        // STRING 타입의 경우 길이 제한 입력 처리
        if (col.type === 'STRING') {
          const { length } = await inquirer.prompt([
            {
              type: 'input',
              name: 'length',
              message: 'STRING 타입의 길이를 지정하세요 (예: 100, 빈 칸이면 기본 STRING 사용):',
              default: ''
            }
          ]);
          if (length.trim() !== '') {
            col.type = `STRING(${length.trim()})`;
          }
        }

        columns.push(col);

        const { continueAdding } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'continueAdding',
            message: '다른 컬럼을 추가하시겠습니까?',
            default: false
          }
        ]);
        addMoreColumns = continueAdding;
      }

      // 3. 시퀄라이즈 설정 입력
      const sequelizeOptions = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'timestamps',
          message: 'timestamps 사용 (createdAt, updatedAt 자동 생성) ?',
          default: true
        },
        {
          type: 'confirm',
          name: 'paranoid',
          message: 'paranoid 사용 (soft delete) ?',
          default: true
        },
        {
          type: 'input',
          name: 'tableName',
          message: '테이블 이름 (없으면 모델 이름의 소문자 복수형으로 사용됩니다)',
          default: modelName.toLowerCase() + 's'
        },
        {
          type: 'input',
          name: 'charset',
          message: '테이블 charset',
          default: 'utf8'
        },
        {
          type: 'input',
          name: 'collate',
          message: '테이블 collate',
          default: 'utf8_general_ci'
        }
      ]);

      // 4. 연관관계 입력 (예: belongsTo, hasMany 등)
      let associations = [];
      let addMoreAssociations = true;
      while (addMoreAssociations) {
        const assoc = await inquirer.prompt([
          {
            type: 'list',
            name: 'type',
            message: '연관관계 종류를 선택하세요',
            choices: ['belongsTo', 'hasMany', 'hasOne']
          },
          {
            type: 'input',
            name: 'target',
            message: '연관 대상 모델 이름을 입력하세요 (예: User)',
            validate: input => input ? true : '대상 모델은 필수입니다.'
          }
        ]);

        associations.push(assoc);

        const { continueAssoc } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'continueAssoc',
            message: '다른 연관관계를 추가하시겠습니까?',
            default: false
          }
        ]);
        addMoreAssociations = continueAssoc;
      }

      // 모델 코드 생성
      const modelCode = generateModelCode(modelName, columns, sequelizeOptions, associations);

      // models 디렉토리가 없으면 생성
      if (!fs.existsSync(MODELS_DIR)) {
        fs.mkdirSync(MODELS_DIR, { recursive: true });
      }

      // models/ 안에 index.js 파일이 없는 경우 생성
      const indexPath = path.join(MODELS_DIR, 'index.js');
      if (!fs.existsSync(indexPath)) {
        fs.writeFileSync(indexPath, indexTemplate);
        console.log(chalk.green(`models/index.js 파일이 생성되었습니다: ${indexPath}`));
      }

      // lib 디렉토리가 없으면 생성
      if (!fs.existsSync(LIB_DIR)) {
        fs.mkdirSync(LIB_DIR, { recursive: true });
      }

      // lib/ 안에 sequelize-loader.js 파일이 없는 경우 생성
      const sequelizeloaderPath = path.join(LIB_DIR, 'sequelize-loader.js');

      if (!fs.existsSync(sequelizeloaderPath)) {
        fs.writeFileSync(sequelizeloaderPath, sequelizeLoaderTemplate);
        console.log(chalk.green(`lib/sequelize-loader.js 파일이 생성되었습니다: ${sequelizeloaderPath}`));
      }

      // 파일 경로 (파일 이름은 소문자로 생성)
      const filePath = path.join(MODELS_DIR, modelName.toLowerCase() + '.js');
      fs.writeFileSync(filePath, modelCode);
      console.log(chalk.green(`모델 파일이 생성되었습니다: ${filePath}`));
    } catch (error) {
      console.error(chalk.red('모델 생성 중 오류 발생:'), error);
    }
  });

program.parse(process.argv);