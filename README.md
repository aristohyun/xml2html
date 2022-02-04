# xml to html

> 현재 위치에서부터 하위 디렉토리에 있는 모든 _.xml_ 파일을 찾아 _.html_로 변환합니다.

- 따라서 폴더를 따로 만든 후, 해당 폴더에 실행파일과 함께, xml 파일이 담겨있는 디렉토리를 옮긴 후 실행시키시면 됩니다
    - 실행파일이 위치한 곳에 html 폴더가 생성되며, 해당 폴더에 변환된 .html 파일이 생성됩니다

- 변환 실패여부에 대해서는 _log.txt_ 파일이 생성됩니다.

- table의 경우 이미지로 사용한 경우와, 실제 table이 작성되어 있는 경우가 있기에 일괄적으로 table로 그대로 옮겨집니다.

- 파일이 너무 많을 경우 에러가 에러가 발생 하기에 _3천개_로 제한하여 변환을 진행합니다.

- preformat 태그의 역할을 살리기 위해, xml 파일에서 앞에 띄워쓰기가 되어있는 경우, 공백을 유지하였습니다.

- 수식의 경우 text-align이 pdf와 다를 수 있습니다.


## 사용 라이브러리

- fs : xml File read, https://github.com/npm, ISC Licence
- fast-xml-parser : xml 구조의 텍스트를 json 형태로 변환, https://github.com/NaturalIntelligence/fast-xml-parser#readme, MIT Licence
- mathml2latex : mathML 구조의 텍스트를 Latex로 변환, https://github.com/mika-cn/mathml2latex, MIT Licence


- pkg : Node.js 실행 코드를 실행파일로 변환, https://github.com/vercel/pkg#readme, MIT Licence
- prettier : prettier 코딩 스타일, https://prettier.io/, MIT License 
