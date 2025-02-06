#!/usr/bin/env node
const { program } = require('commander');
const inquirer = require('inquirer').default;
const chalk = require('chalk').default;
const makeTemplate = require('./commands/makeTemplate');
const findFiles = require('./commands/findFiles');
const copyFiles = require('./commands/copyFiles');
const deleteFiles = require('./commands/deleteFiles');

program
    .version('0.0.1', '-v, --version')
    .name('cli');

// program
//     .command('template <type>') //명령 <>은 필수값, []은 선택값
//     .usage('<type> --filename [filename] --path [path]')    //명령어 설명
//     .description('템플릿을 생성합니다.')  //한글 설명
//     .alias('tmpl')  //별칭 tmpl 로 사용가능
//     .option('-f, --filename [filename]', '파일명을 입력하세요.', 'index')   //[] 옵션들에 대한 설정
//     .option('-d, --directory [path]', '생성 경로를 입력하세요.', '.')
//     .action((type, options, command) => {
//         makeTemplate(type, options.filename, options.directory);
//     });

program
    .action(() => {
        inquirer.prompt([
            {
                type: 'list',
                name: 'task',
                message: '작업을 선택하세요.',
                choices: ['라우터 생성', '파일 찾기', '파일 복사', '파일 삭제'],
            }
        ])
        .then((answer) => {
            if (answer.task === '라우터 생성') {
                // 라우터 생성 작업에 필요한 추가 프롬프트
                inquirer.prompt([
                  {
                    type: 'input',
                    name: 'name',
                    message: '파일의 이름을 입력하세요.',
                    default: 'index'
                  },
                  {
                    type: 'input',
                    name: 'directory',
                    message: '파일이 위치할 폴더의 경로를 입력하세요.',
                    default: '.'
                  },
                  {
                    type: 'confirm',
                    name: 'confirm',
                    message: '생성하시겠습니까?'
                  }
                ])
                .then((answers) => {
                  if (answers.confirm) {
                    // 선택한 옵션으로 라우터 생성 (makeTemplate 함수 호출 예시)
                    makeTemplate('express-router', answers.name, answers.directory);
                    console.log(chalk.rgb(128, 128, 128)('라우터가 생성되었습니다. 터미널을 종료합니다.'));
                  }
                });
            } else if (answer.task === '파일 찾기') {
                // 파일 찾기 작업에 필요한 추가 프롬프트
                inquirer.prompt([
                  {
                    type: 'input',
                    name: 'directory',
                    message: '검색할 디렉토리 경로를 입력하세요.',
                    default: '.'
                  },
                  {
                    type: 'input',
                    name: 'extension',
                    message: '찾고자 하는 파일의 확장자를 입력하세요. (예: .js)',
                    default: '.js'
                  },
                  {
                    type: 'input',
                    name: 'filename',
                    message: '찾고자 하는 파일 이름을 입력하세요.',
                  },
                ])
                .then((answers) => {
                  // findFiles 함수 호출 (예시로 디렉토리 내 해당 확장자 파일 검색)
                  const files = findFiles(answers.directory, answers.extension, answers.filename);
                  console.log(chalk.green(`검색 결과 (${files.length}개):`));
                  files.forEach(file => console.log(file));
                });
            } else if (answer.task === '파일 복사') {
                // 파일 복사 작업에 필요한 추가 프롬프트
                inquirer.prompt([
                  {
                    type: 'input',
                    name: 'srcDir',
                    message: '복사할 소스 디렉토리 경로를 입력하세요. (복사할 경로)',
                    default: '.'
                  },
                  {
                    type: 'input',
                    name: 'destDir',
                    message: '복사할 대상 디렉토리 경로를 입력하세요. (복사되는 경로)',
                    default: '.'
                  },
                  {
                    type: 'input',
                    name: 'extension',
                    message: '복사하는 파일의 확장자를 입력하세요. (예: .js)',
                    default: '.js'
                  },
                  {
                    type: 'input',
                    name: 'filename',
                    message: '복사하는 파일 이름을 입력하세요.',
                  },
                ])
                .then((answers) => {
                  // findFiles 함수 호출 (예시로 디렉토리 내 해당 확장자 파일 검색)
                  const files = copyFiles(answers.srcDir, answers.destDir, answers.extension, answers.filename);
                  console.log(chalk.green(`복사된 파일들 :`));
                  files.forEach(file => chalk.yellow.bold(console.log(file)));
                });
            } else if (answer.task === '파일 삭제') {
                // 파일 삭제 작업에 필요한 추가 프롬프트
                inquirer.prompt([
                  {
                    type: 'input',
                    name: 'directory',
                    message: '삭제할 디렉토리 경로를 입력하세요.',
                    default: '.'
                  },
                  {
                    type: 'input',
                    name: 'extension',
                    message: '삭제하는 파일의 확장자를 입력하세요. (예: .js)',
                    default: '.js'
                  },
                  {
                    type: 'input',
                    name: 'filename',
                    message: '삭제하는 파일 이름을 입력하세요.',
                  },
                ])
                .then((answers) => {
                  // findFiles 함수 호출 (예시로 디렉토리 내 해당 확장자 파일 검색)
                  const files = deleteFiles(answers.directory, answers.extension, answers.filename);
                  console.log(chalk.green(`삭제된 파일들 :`));
                  files.forEach(file => chalk.yellow.bold(console.log(file)));
                });
            }
        })
    })
    .parse(process.argv);