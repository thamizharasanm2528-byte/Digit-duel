import { Router, type IRouter } from "express";
import healthRouter from "./health";
import localIpRouter from "./localip";
import downloadRouter from "./download";

const router: IRouter = Router();

router.use(healthRouter);
router.use(localIpRouter);
router.use(downloadRouter);

export default router;
