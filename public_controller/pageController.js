// ============================================================
// public_controller/pageController.js
// ============================================================

const Page        = require("../modal/pageSchema");
const Meta        = require("../modal/metaSchema");
const SlugHistory = require("../modal/slugHistorySchema");

// GET /pages/:slug — get a page by slug with meta
exports.getPublicPageBySlug = async (req, res) => {
  try {
    const slug = req.params.slug?.toLowerCase().trim();

    const meta = await Meta.findOne({ slug,entity_type:"page"})
      .lean();

    if (meta) {
      const page = await Page.findOne({
       /*  entity_type: meta.entity_type, */
        _id:   meta.entity_id,
      }).lean();
      /* console.log(page); */
      

      return res.status(200).json({
        success: true,
        data: { ...page, meta: meta || {} },
      });
    }

    // slug history fallback
    const history = await SlugHistory.findOne({
      old_slug:    slug,
    });
   /*  console.log(history); */
    

    if (history) {
      /* console.log(history.entity_id);
      console.log(history.entity_type); */
      const current = await Meta.findOne({
        _id:      history.entity_id,
        entity_type: history.entity_type,
      }).select("slug").lean();

       /* console.log(current); */

      if (current?.slug) {
        if(history.entity_type=='service'){
              var url ='services/'+current.slug;
        }
        else if(history.entity_type=='casestudy'){
              var url='case-studies/'+current.slug;
        }
        else if(history.entity_type=='blog'){
              var url='insights/'+current.slug;
        }
        else{
              var url=current.slug
        }
       
           /* console.log(url);  */
        return res.status(200).json({
          redirect: true,
          newSlug:  url,
        });
      }
    }

    return res.status(404).json({ message: "Page not found" });
  } catch (error) {
    console.error("GET PUBLIC PAGE BY SLUG ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};


// ============================================================
// Router/public_router.js — ADD
// ============================================================
/*
const pageController = require("../public_controller/pageController");

router.get("/pages/:slug", pageController.getPublicPageBySlug);
*/