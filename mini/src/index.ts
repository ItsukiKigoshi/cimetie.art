import { Hono } from 'hono'
import { html } from 'hono/html'

const app = new Hono()

type Museum = { id: number; name: string; visited: boolean }
let museums: Museum[] = [
  { id: 1, name: '東京都現代美術館', visited: false },
  { id: 2, name: 'ワタリウム美術館', visited: true },
]

const Layout = (content: any) => html`
  <!DOCTYPE html>
  <html lang="ja">
    <head>
      <title>Cimetie.art</title>
    </head>
    <body>
      <h1>Museum</h1>
      ${content}
    </body>
  </html>
`

app.get('/', (c) => {
  const query = c.req.query('q')?.toLowerCase() || ''
  const filteredMuseums = museums.filter(s => s.name.toLowerCase().includes(query))

  return c.html(Layout(html`
    <!-- 登録フォーム -->
    <section>
      <h3>新しい美術館</h3>
      <form action="/add" method="POST">
        <input type="text" name="name" placeholder="館名を入力" required>
        <button type="submit">登録</button>
      </form>
    </section>
    
    <!-- 一覧表示 -->
    <section>
      <h3>リスト</h3>
      <ul>
        ${filteredMuseums.map(museum => html`
          <li>
            <span>${museum.visited ? '[Bucket]' : '[Visited]'} ${museum.name}</span>
            <form action="/toggle" method="POST" style="display:inline;">
              <input type="hidden" name="id" value="${museum.id}">
              ${museum.visited && html`
      <form action="/toggle" method="POST" style="display:inline;">
        <input type="hidden" name="id" value="${museum.id}">
        <button type="submit">行った！</button>
      </form>
    `}
            </form>
          </li>
        `)}
      </ul>
    </section>
  `))
})

// Museum追加処理
app.post('/add', async (c) => {
  const { name } = await c.req.parseBody()
  if (typeof name === 'string') {
    museums.push({ id: Date.now(), name, visited: false })
  }
  return c.redirect('/')
})

// 訪問ステータス切り替え処理
app.post('/toggle', async (c) => {
  const { id } = await c.req.parseBody()
  const museum = museums.find(s => s.id === Number(id))
  if (museum) museum.visited = !museum.visited
  return c.redirect('/')
})

export default app
