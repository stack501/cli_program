const fs = require('fs');
const path = require('path');

/**
 * 지정한 디렉토리 내에서 파일들을 재귀적으로 탐색합니다.
 *
 * - extension과 filename이 모두 제공되지 않으면, 경로 내의 모든 파일을 반환합니다.
 * - extension만 제공되면, 해당 확장자로 끝나는 파일만 반환합니다.
 * - filename만 제공되면, 파일 이름(확장자 제외)이 일치하는 파일만 반환합니다.
 * - extension과 filename 둘 다 제공되면, 두 조건을 모두 만족하는 파일만 반환합니다.
 *
 * @param {string} dir - 탐색 시작 디렉토리
 * @param {string} [extension] - (선택) 파일 확장자 (예: '.js')
 * @param {string} [filename] - (선택) 찾고자 하는 파일의 이름 (확장자 제외)
 * @returns {string[]} - 찾은 파일들의 경로 배열
 */
function findFiles(dir, extension, filename) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    // 디렉토리와 파일 이름을 결합하여 전체 경로를 생성합니다.
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    
    // 현재 항목이 디렉토리라면 재귀적으로 탐색합니다.
    if (stat && stat.isDirectory()) {
      results = results.concat(findFiles(file, extension, filename));
    } else {
      // 조건에 따라 파일을 선택합니다.
      // 두 조건 모두 제공된 경우
      if (extension && filename) {
        if (
          file.endsWith(extension) &&
          path.basename(file, path.extname(file)) === filename
        ) {
          results.push(file);
        }
      }
      // filename만 제공된 경우
      else if (filename) {
        if (path.basename(file, path.extname(file)) === filename) {
          results.push(file);
        }
      }
      // extension만 제공된 경우
      else if (extension) {
        if (file.endsWith(extension)) {
          results.push(file);
        }
      }
      // 아무 조건도 없는 경우 -> 모든 파일 추가
      else {
        results.push(file);
      }
    }
  });
  
  return results;
}

module.exports = findFiles;