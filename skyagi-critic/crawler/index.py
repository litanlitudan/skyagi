import asyncio
from imbd import IMDBCrawler

async def main():
    crawler = IMDBCrawler()
    result = await crawler.scrape()
    print(result)
    return


if __name__ == '__main__':
    asyncio.run(main())