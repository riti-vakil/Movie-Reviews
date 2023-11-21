import responseHandler from "../handlers/response.handler.js";
import tmdbApi from "../tmdb/tmdb.api.js";
import userModel from "../models/user.model.js";
import favoriteModel from "../models/favorite.model.js";
import reviewModel from "../models/review.model.js";
import tokenMiddlerware from "../middlewares/token.middleware.js";
import puppeteer from "puppeteer"
import streamsModel from "../models/streams.model.js";

const getList = async (req, res) => {
  try {
    const { page } = req.query;
    const { mediaType, mediaCategory } = req.params;

    const response = await tmdbApi.mediaList({ mediaType, mediaCategory, page });

    return responseHandler.ok(res, response);
  } catch {
    responseHandler.error(res);
  }
};

const getGenres = async (req, res) => {
  try {
    
    const { mediaType } = req.params;
   

    const response = await tmdbApi.mediaGenres({ mediaType });

    return responseHandler.ok(res, response);
  } catch {
    responseHandler.error(res);
  }
};

const search = async (req, res) => {
  try {

    const { mediaType } = req.params;
    const { query, page } = req.query;
    console.log(mediaType);
    console.log(query);
    // page = req.query.page;
    console.log(page);
    const response = await tmdbApi.mediaSearch({
      query,
      page,
      mediaType: mediaType === "people" ? "person" : mediaType
    });
    responseHandler.ok(res, response);
  } catch {
    responseHandler.error(res);
  }
};

const getDetail = async (req, res) => {
  try {
    const { mediaType, mediaId } = req.params;
    
    const params = { mediaType, mediaId };

    const media = await tmdbApi.mediaDetail(params);

    media.credits = await tmdbApi.mediaCredits(params);

    const videos = await tmdbApi.mediaVideos(params);

    media.videos = videos;

    const recommend = await tmdbApi.mediaRecommend(params);

    media.recommend = recommend.results;

    media.images = await tmdbApi.mediaImages(params);
    console.log(media.name);
    console.log(mediaType);
    var scraped; 
    
    if(mediaType == "movie"){
      scraped = await scrape(media.title, mediaType);}
    if (mediaType == "tv"){
      scraped = await scrape(media.name, mediaType);}
    var streams = new streamsModel({ 
        mediaId: mediaId, 
        mediaType: mediaType, 
        mediaTitle: media.title || media.name,
        services: scraped.streams, 
        prices: scraped.prices 
    })
    streams.save()
    const tokenDecoded = tokenMiddlerware.tokenDecode(req);

    if (tokenDecoded) {
      const user = await userModel.findById(tokenDecoded.data);

      if (user) {
        const isFavorite = await favoriteModel.findOne({ user: user.id, mediaId });
        media.isFavorite = isFavorite !== null;
      }
    }

    media.reviews = await reviewModel.find({ mediaId }).populate("user").sort("-createdAt");

    responseHandler.ok(res, media);
  } catch (e) {
    console.log(e);
    responseHandler.error(res);
  }
};

const scrape = async (query, type) => {
  try {
    console.log(query)
    console.log(type)
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://google.com');
    const searchBox = await page.$x("//*[@id='APjFqb']");
    // console.log(searchBox)
    await searchBox[0].type(`${query} ${type} streaming`);
    await page.keyboard.press('Enter');
    await page.waitForNavigation();
    const resultsContainer = await page.$$('div.nGOerd.oF0GDf')
    var streamingPrices;
    var streamingPlatforms;
    for (let i = 0; i < resultsContainer.length; i++) {
      streamingPlatforms = await resultsContainer[i].$$eval('div.ellip.bclEt', nodes => nodes.map(n => n.innerText));
      streamingPrices = await resultsContainer[i].$$eval('div.ellip.rsj3fb', nodes => nodes.map(n => n.innerText))

    }
    
    console.log(streamingPlatforms)
    console.log(streamingPrices)
    await browser.close();
    return {
      streams: streamingPlatforms, 
      prices: streamingPrices
    }
  } catch (error) {
    console.log(error)
  }
}

export default { getList, getGenres, search, getDetail };