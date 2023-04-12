const router = require("express").Router();
const errorMiddleware = require("../middlewares/error-middleware");
const usersRouter = require("./users-router");
const photosRouter = require("./photos-router");
const authenticationMiddleware = require("../middlewares/authentication-middleware");

router.use(usersRouter);
router.use("/photos", authenticationMiddleware, photosRouter);

router.use((req, res, next) => {
  next({ name: "PageNotFound" });
});

router.use(errorMiddleware);

module.exports = router;
