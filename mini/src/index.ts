import { Hono } from 'hono'
import { html } from 'hono/html'

type Bindings = {
    cimetie_art_db_mini: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

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

app.get('/', async (c) => {
    const query = c.req.query('q') || ''

    try {
        // SQLでデータを取得（cimetie_art_db_mini を使用）
        const { results } = await c.env.cimetie_art_db_mini.prepare(
            'SELECT * FROM museums WHERE name LIKE ?'
        ).bind(`%${query}%`).all()

        const filteredMuseums = results || []

        return c.html(Layout(html`
            <section>
                <h3>新しい美術館を登録</h3>
                <form action="/add" method="POST">
                    <input type="text" name="name" placeholder="美術館の名前" required>
                    <button type="submit">登録</button>
                </form>
            </section>

            <hr>

            <section>
                <h3>リスト</h3>
                ${filteredMuseums.length === 0
                        ? html`<p>データがありません。上のフォームから登録してください。</p>`
                        : html`
                    <ul >
                        ${filteredMuseums.map(museum => html`
                            <li >
                                <form action="/toggle" method="POST" >
                                    <input type="hidden" name="id" value="${museum.id}">
                                    <label>
                                        <input 
                                            type="checkbox" 
                                            ${museum.visited ? 'checked' : ''} 
                                            onchange="this.form.submit()"
                                        >
                                        <span>
                                            ${museum.name}
                                        </span>
                                    </label>
                                </form>
                            </li>
                        `)}
                    </ul>
                `}
            </section>
        `))
    } catch (e) {
        return c.html(Layout(html`<p>エラーが発生しました: ${e}</p>`))
    }
})

// 追加処理
app.post('/add', async (c) => {
    const { name } = await c.req.parseBody()
    if (typeof name === 'string') {
        await c.env.cimetie_art_db_mini.prepare('INSERT INTO museums (name, visited) VALUES (?, 0)')
            .bind(name)
            .run()
    }
    return c.redirect('/')
})

// 切り替え処理
app.post('/toggle', async (c) => {
    const { id } = await c.req.parseBody()
    // visitedを反転させるSQL（0なら1に、1なら0にする）
    await c.env.cimetie_art_db_mini.prepare('UPDATE museums SET visited = 1 - visited WHERE id = ?')
        .bind(id)
        .run()
    return c.redirect('/')
})

export default app