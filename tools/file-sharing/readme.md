這個工具是用來確認兩個project的檔案共用情況的工具
分為五種結果
- both: 兩個project都有用到
- only1: 被指定為project1的project才有用到
- only2: 被指定為project2的project才有用到
- exception: 例外情況，.d.ts檔案與部份的interface不會被webpack載入
- neither: 兩個project都有用到而且不是例外情況

實作這個工具的方法是將每個.ts/.vue檔案加入console.log
如此一來有載入的文件就會log出自己的路徑
並且透過在stk的App.vue mounted加入
```ts
const all = require.context('', true, /.+\.(vue|ts)$/).keys()
all.forEach((v, i) => {
  all[+i] = v.replace('./', '@/')
})
console.log(all)
```
取得webpack所有可用檔案的路徑
這個all會存成allFiles.json

每個py檔案上方有一段config區域
需要改這邊的設定來使用
每個設定都有project選項 需要放projects/(project)的(project)部分
例如vivipic stk charmix

1. 把project中每個asnyc import的vue檔案都改成sync
2. 執行printSelf.py在各檔案中插入console.log
insert完了之後會自動創一個(project)UsedRaw.txt檔案
3. 用瀏覽器載入網頁
將console的內容全數複製到(project)UsedRaw.txt內
4. 執行printSelf.py mode選erase
用來把console.log都消去
5. 執行processConsole.py產生(project)Used.json
6. 對另一個project也做同樣的事情
7. 想辦法搞到兩個project全部檔案list並且存成allFiles.json
因為stk是pic的延伸 stk用不到的檔案不會被刪除的緣故
因此stk那邊取webpack所有檔案就能取到pic與stk的檔案聯集
7. 執行diff.py來產生diffResult.json
內容物就是一開始說的五種結果
8. 根據diffResult.json執行其他腳本操作檔案或手動操作

