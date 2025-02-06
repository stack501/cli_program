const fs = require('fs');
const path = require('path');

/**
 * 지정한 디렉토리에서 특정 확장자 및 (선택적으로) 파일 이름 조건에 맞는 파일들을
 * 재귀적으로 삭제하는 함수입니다.
 *
 * 확장자와 파일명이 모두 제공되지 않으면, 해당 디렉토리 전체를 삭제합니다.
 *
 * @param {string} dir - 삭제할 파일들을 찾기 위한 시작 디렉토리 경로
 * @param {string} [extension] - 삭제할 파일의 확장자 (예: '.js')
 * @param {string} [filename] - (선택) 삭제할 파일의 이름 (확장자 제외). 이 값이 지정되면,
 *                              파일명(확장자 제외)이 해당 값과 일치하는 파일만 삭제합니다.
 * @returns {string[]} - 삭제된 파일(또는 디렉토리)의 경로 배열
 */
function deleteFiles(dir, extension, filename) {
    // 확장자와 파일명이 둘 다 제공되지 않으면, 전체 디렉토리 삭제
    if (!extension && !filename) {
        // fs.rmSync는 Node v14.14.0 이상에서 지원됩니다.
        // 재귀적으로 디렉토리 전체를 삭제하고 force 옵션을 사용하여 읽기 전용 파일 등도 삭제합니다.
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`Deleted directory: ${dir}`);
        return [dir];
    }

    let deletedFiles = [];
    // 시작 디렉토리의 항목들을 읽어옵니다.
    const list = fs.readdirSync(dir);

    list.forEach(file => {
        // 각 항목의 전체 경로를 생성합니다.
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat && stat.isDirectory()) {
            // 항목이 디렉토리인 경우, 재귀적으로 내부 파일/디렉토리 삭제 작업을 수행합니다.
            deletedFiles = deletedFiles.concat(deleteFiles(filePath, extension, filename));

            // 내부의 삭제 작업 후, 디렉토리가 비어있다면 디렉토리 자체도 삭제합니다.
            const remaining = fs.readdirSync(filePath);
            if (remaining.length === 0) {
                fs.rmdirSync(filePath);
                console.log(`Deleted empty directory: ${filePath}`);
            }
        } else {
            // 파일인 경우, 우선 확장자 조건을 확인합니다.
            if (extension && !filePath.endsWith(extension)) {
                return; // 확장자가 조건에 맞지 않으면 현재 반복 건너뜁니다.
            }
            // filename 조건이 지정된 경우, 파일 이름(확장자 제외)이 일치하는지 확인합니다.
            if (filename) {
                const baseName = path.basename(filePath, path.extname(filePath));
                if (baseName !== filename) {
                    return; // 파일명이 일치하지 않으면 건너뜁니다.
                }
            }
            // 조건에 맞는 파일이면, 삭제를 진행합니다.
            fs.unlinkSync(filePath);
            console.log(`Deleted: ${filePath}`);
            deletedFiles.push(filePath);
        }
    });

    return deletedFiles;
}

module.exports = deleteFiles;