const fs = require(`fs`)
const fsp = require(`fs/promises`)
const path = require(`path`)

const remark = require(`remark`)
const remarkPrism = require(`remark-prism`)
const remarkHtml = require(`remark-html`)

const puppeteer = require(`puppeteer`)

const weasyprint = require(`weasyprint-wrapper`);


const headingDownlevel = require(`./workers/pdf/heading-downlevel`)
const headingAddAnchor = require(`./workers/pdf/heading-add-anchor`)
const headingAddDecor = require(`./workers/pdf/heading-add-decor`)
const HtmlTemplates = require(`./workers/pdf/templates`)


async function generateCover(){
    // const browser = await puppeteer.launch({
    //     headless: true
    // });
    //
    // const page = await browser.newPage();
    // await page.setContent(HtmlTemplates.Html({ content }));
    //
    //
    //
    // await page.addStyleTag({ path: path.join(process.cwd(), `./workers/pdf/style.css`) });
    // await page.addStyleTag({ path: path.join(process.cwd(), `./workers/pdf/prism-vs.theme.css`) });
    // await page.addStyleTag({ path: path.join(process.cwd(), `./workers/pdf/prism-custom.theme.css`) });
    // await page.addStyleTag({ path: path.join(process.cwd(), `./workers/pdf/content.css`) });
    // // await page.setDefaultNavigationTimeout(0);
    // // await page.goto(`data:text/html,${content}`, { waitUntil: 'networkidle2', timeout: 0 });
    // const buffer = await page.pdf({
    //     path: `./book.pdf`,
    //     format: 'A4',
    //     printBackground: true,
    //     preferCSSPageSize: true,
    //     displayHeaderFooter: true,
    //     footerTemplate: HtmlTemplates.PageHeader({styles: HtmlTemplates.styles.header}),
    //     // footerTemplate: `<div class="header" hidden>Ok</div>`,
    //     margin: {
    //         left: '56px',
    //         top: '64px',
    //         right: '64px',
    //         bottom: '96px'
    //     }
    // });
    await browser.close();
}

async function Pdf ({ inputPaths, outputDir, args: { toc, bookInfo, bookCoverPath } }) {
    console.time(`Generation Book Pdf`);

    let processor = remark()
        .use(headingDownlevel)
        .use(headingAddDecor, {toc})
        .use(remarkPrism)
        .use(remarkHtml);

    let htmlAll = await Promise.all(
        bookInfo.map(async info => {
            let markdown = await fsp.readFile(info.path, { encoding: `utf-8` });
            let html = await processor.process(markdown);

            return HtmlTemplates.Page(html);
        })
    );

    let bookCover = HtmlTemplates.Page(HtmlTemplates.BookCover(bookCoverPath));
    let bookTitlePage = HtmlTemplates.Page(HtmlTemplates.BookTitlePage(), `page_title`);
    let content = HtmlTemplates.Html({
        root: `./workers/pdf`,
        content: [bookCover, bookTitlePage, ...htmlAll].join(``)
    });

    const createPdf = (content, outputPath) => new Promise((resolve, reject) => {
        let stream = weasyprint(content)
            .pipe(fs.createWriteStream(outputPath));
        stream.on(`finish`, resolve);
        stream.on(`error`, reject);
    });

    await createPdf(content, `./book.pdf`);

    await fsp.writeFile(`./book.html`, content)

    console.timeEnd(`Generation Book Pdf`);


    return Promise.resolve();
}

exports = { Pdf };

const toc = require(`../book/ru/metadata/toc.json`)

Pdf({
    inputPaths: [
        {path:`/home/ivan/Projects/typescript-definitive-guide/book/ru/chapters/011.(Синтаксические конструкции) Аннотация Типов/content.md`},
        {path: `/home/ivan/Projects/typescript-definitive-guide/book/ru/chapters/012.(Типы) Базовый Тип Any/content.md`}
    ],
    args: {
        toc,
        bookCoverPath: `/home/ivan/Projects/typescript-definitive-guide/book/ru/metadata/cover.jpg`,
        bookInfo: [
            {
                path: `/home/ivan/Projects/typescript-definitive-guide/book/ru/chapters/011.(Синтаксические конструкции) Аннотация Типов/content.md`,
                index: 0,
                section: `Section A`,
                title: `TypeScript Definitive Guide`
            },
            {
                path: `/home/ivan/Projects/typescript-definitive-guide/book/ru/chapters/012.(Типы) Базовый Тип Any/content.md`,
                index: 1,
                section: `Section B`,
                title: `TypeScript Definitive Guide`
            }        ]
    }
})