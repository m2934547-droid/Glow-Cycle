import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import cyclesRouter from "./cycles";
import calendarRouter from "./calendar";
import productsRouter from "./products";
import cartRouter from "./cart";
import adminRouter from "./admin";
import wellnessRouter from "./wellness";
import partnersRouter from "./partners";
import consultantsRouter from "./consultants";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(cyclesRouter);
router.use(calendarRouter);
router.use(productsRouter);
router.use(cartRouter);
router.use(adminRouter);
router.use(wellnessRouter);
router.use(partnersRouter);
router.use(consultantsRouter);

export default router;
