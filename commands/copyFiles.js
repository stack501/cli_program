const fs = require('fs');
const path = require('path');

/**
 * 지정한 소스 디렉토리에서 특정 확장자 및 (선택적으로) 파일 이름 조건에 맞는 파일들을
 * 대상 디렉토리로 재귀적으로 복사하는 함수입니다.
 *
 * 확장자와 파일명이 모두 제공되지 않으면, 소스 디렉토리 전체를 복사합니다.
 *
 * @param {string} srcDir - 소스 디렉토리 경로
 * @param {string} destDir - 대상 디렉토리 경로
 * @param {string} [extension] - 복사할 파일의 확장자 (예: '.js')
 * @param {string} [filename] - (선택) 복사할 파일의 이름 (확장자 제외). 이 값이 지정되면,
 *                              파일명(확장자 제외)이 해당 값과 일치하는 파일만 복사합니다.
 * @returns {string[]} - 복사된 파일들의 경로 배열
 */
function copyFiles(srcDir, destDir, extension, filename) {
    // 확장자와 파일명이 둘 다 제공되지 않은 경우, 전체 디렉토리를 복사합니다.
    if (!extension && !filename) {
        // 대상 디렉토리가 없으면 생성합니다.
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        // Node v16 이상에서 지원하는 fs.cpSync를 사용하여 전체 디렉토리를 복사합니다.
        fs.cpSync(srcDir, destDir, { recursive: true });
        console.log(`Copied entire directory: ${srcDir} -> ${destDir}`);
        return [];
    }

    // 필터링 조건이 있는 경우, 개별 파일 단위로 복사합니다.
    // 대상 디렉토리가 없으면 재귀적으로 생성합니다.
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    let results = [];
    // 소스 디렉토리의 항목들을 읽어옵니다.
    const list = fs.readdirSync(srcDir);

    list.forEach(file => {
        // 소스 파일의 전체 경로와, 대상 파일의 전체 경로를 생성합니다.
        const srcFile = path.join(srcDir, file);
        const destFile = path.join(destDir, file);
        const stat = fs.statSync(srcFile);
        
        if (stat && stat.isDirectory()) {
            // 항목이 디렉토리인 경우, 재귀적으로 복사합니다.
            // 재귀 호출 시 필터 조건(extension, filename)을 그대로 전달합니다.
            copyFiles(srcFile, destFile, extension, filename);
        } else {
            // 파일인 경우, 우선 확장자 조건을 확인합니다.
            if (extension && !srcFile.endsWith(extension)) {
                return; // 확장자가 조건에 맞지 않으면 현재 반복 건너뜁니다.
            }
            // filename 조건이 지정된 경우, 파일명(확장자 제외)이 일치하는지 확인합니다.
            if (filename) {
                const baseName = path.basename(srcFile, path.extname(srcFile));
                if (baseName !== filename) {
                    return; // 파일명이 일치하지 않으면 건너뜁니다.
                }
            }

            results.push(srcFile);
            // 조건에 맞는 파일이면, 파일을 대상 디렉토리로 복사합니다.
            fs.copyFileSync(srcFile, destFile);
            console.log(`Copied: ${srcFile} -> ${destFile}`);
        }
    });

    return results;
}

module.exports = copyFiles;