// Where the plots of each settlement stand on its painted map assets/towns/<id>.jpg (1376 x 768 px, bird's-eye
// painting, no buildings: the clearings for them are painted as tilled rectangles in perspective).
//
// A layout is written in IMAGE PIXELS of that picture (so it can be checked against the file) and converted once,
// here, to fractions u, v (0..1 of the picture). town_scene.js turns u, v into scene coordinates in one place
// (`toScene`), so cropping or letterboxing of the picture can never misplace a plot.
//
// plots[i] = [x, y, w, free]: the CENTRE of the painted clearing for settlement slot i, the clearing's width in
// picture pixels (the size of the building drawn there follows it, so buildings far up the picture are smaller)
// and 1 when the plot is not a painted clearing but open lawn or beach (it gets a patch of trodden earth).
// The order is the order plots open with the settlement's level (build.js SLOTS = [0, 3, 4, 6, 8, 10],
// farm FARM_SLOTS = [0, 2, 4, 6, 7]): the middle, most visible clearings first, then outwards.
//
// The maps of the villages, of the lodge and of the farm share one template of 16 clearings (two rows left and
// right of the crossing); each settlement uses its own choice of ten of them, plus the lawns the map offers.
// The abbey, port and capital have their own arrangement. To move a plot, change a pixel here and look at the
// settlement; `node tools/town_layout_report.mjs` lists plots that crowd each other.

export const IMG_W = 1376;
export const IMG_H = 768;

const round3 = (a) => a.map((n) => Math.round(n * 1000) / 1000);
const plots = (list) => list.map(([x, y, w, free]) => [...round3([x / IMG_W, y / IMG_H, w / IMG_W]), free ? 1 : 0]);
const rc = ([x0, y0, x1, y1]) => round3([x0 / IMG_W, y0 / IMG_H, x1 / IMG_W, y1 / IMG_H]);
const lines = (list) => list.map((l) => l.map(([x, y]) => round3([x / IMG_W, y / IMG_H])));

// the template of the village-type maps: back row (y ~ 347) and front row (y ~ 435), left and right of the crossing
const R1L = { 580: [580, 347, 100], 470: [470, 347, 100], 364: [364, 347, 100], 258: [258, 347, 100] };
const R1R = { 795: [795, 350, 105], 915: [915, 350, 105], 1018: [1018, 350, 100], 1120: [1120, 350, 100] };
const R2L = { 580: [580, 437, 145], 435: [435, 432, 135], 295: [295, 432, 135], 160: [160, 432, 125] };
const R2R = { 780: [780, 440, 145], 905: [905, 440, 140], 1040: [1040, 438, 135], 1180: [1180, 435, 130] };

// walking routes of the villagers: polylines in picture pixels (the painted roads)
const CROSS_ROADS = lines([
  [[10, 384], [330, 382], [688, 380], [1000, 384], [1366, 382]],
  [[688, 150], [684, 300], [688, 400], [690, 560], [694, 764]],
]);

export const TOWN_LAYOUTS = {
  // the royal city: a paved square, four big blocks of clearings and a well in front
  capital: {
    grow: 1.4,
    plots: plots([[522, 472, 150], [852, 472, 150], [578, 318, 105], [800, 318, 105], [352, 472, 150], [995, 472, 150], [470, 318, 105], [905, 318, 105], [190, 472, 150], [1170, 472, 150]]),
    roads: lines([[[160, 385], [690, 388], [1215, 385]], [[690, 160], [690, 400], [688, 560], [692, 764]]]),
  },
  // a crossing with a bridge at the bottom, three rows of clearings and two kitchen gardens
  brod: {
    grow: 1.5,
    plots: plots([[430, 432, 135], [910, 440, 135], [580, 345, 95], [300, 432, 135], [1040, 438, 135], [365, 345, 95], [1120, 350, 95], [150, 432, 130], [1180, 435, 130], [530, 282, 95]]),
    roads: lines([[[40, 384], [330, 384], [688, 380], [1000, 384], [1300, 400]], [[690, 190], [684, 300], [688, 400], [690, 560], [680, 640]]]),
  },
  // sea and beach on the left, clearings at the top right behind the salt pans, the open dune lawn below and the beach by the pier
  port: {
    grow: 1.45,
    plots: plots([[780, 438, 130], [905, 438, 130], [795, 350, 100], [1040, 438, 125], [400, 408, 100, 1], [1020, 352, 95], [880, 590, 130, 1], [1175, 435, 120], [1100, 615, 130, 1], [440, 625, 100, 1]]),
    roads: lines([[[350, 497], [650, 505], [688, 440], [720, 385], [1366, 380]], [[680, 330], [688, 420], [688, 560], [694, 764]]]),
  },
  // the cloister garden in the middle, herb beds on both sides of the church, lawns inside the wall
  abbey: {
    grow: 1.9,
    plots: plots([[550, 331, 66], [967, 335, 66], [1010, 500, 100, 1], [445, 376, 66], [1130, 312, 62], [905, 548, 100, 1], [1235, 480, 110, 1], [395, 436, 90, 1], [985, 290, 62], [375, 352, 66]]),
    roads: lines([[[430, 440], [600, 395], [740, 330], [820, 296], [900, 280]]]),
  },
  // two rows of clearings under the spoil heaps, a rail line in the middle
  mine: {
    grow: 1.5,
    plots: plots([[585, 558, 105], [785, 560, 115], [565, 655, 120], [805, 655, 125], [345, 558, 110], [1025, 560, 110], [430, 655, 125], [945, 655, 125], [225, 558, 110], [1145, 558, 105]]),
    roads: lines([[[20, 490], [330, 500], [688, 520], [1000, 505], [1366, 510]], [[690, 480], [688, 560], [690, 660], [690, 764]]]),
  },
  // forest all round, a logging yard with stumps at the lower right
  lodge: {
    grow: 1.5,
    plots: plots([R2L[580], R2R[780], R2L[435], R2R[905], R2L[295], R2R[1040], [860, 585, 125, 1], R2L[160], R1L[364], R2R[1180]]),
    roads: CROSS_ROADS,
  },
  lipnice: {
    grow: 1.5,
    plots: plots([R2L[580], R2R[780], R2L[435], R2R[905], R1L[364], R2L[295], R2R[1040], R1R[1120], R2L[160], R2R[1180]]),
    roads: CROSS_ROADS,
  },
  // the village below the castle: the right side (orchard, pond) fills first
  dubovice: {
    grow: 1.5,
    plots: plots([R2R[780], R2L[580], R2R[905], R2L[435], R1R[1120], R2R[1040], R2L[295], R1L[364], R2R[1180], R2L[160]]),
    roads: CROSS_ROADS,
  },
  // the river runs on the left: the front clearings first, the field strips and the road on the right
  zareci: {
    grow: 1.5,
    plots: plots([R2L[580], R2R[780], R2L[435], R2R[905], R1L[364], R2R[1040], R2L[295], R1R[1120], R2R[1180], R1L[470]]),
    roads: CROSS_ROADS,
  },
  // the farm: the house stands on the back left clearing, the yard (paddock, sty, sacks) on the meadows in front
  grunt: {
    grow: 1.5,
    plots: plots([R2L[435], R2R[905], R1R[1120], R2L[295], R2R[1040], R2R[1180], R2L[160]]),
    house: [...round3([580 / IMG_W, 347 / IMG_H]), 100 / IMG_W],
    paddock: rc([730, 548, 1150, 600]),
    sty: rc([40, 566, 262, 640]),
    sacks: round3([652 / IMG_W, 378 / IMG_H]),
    roads: CROSS_ROADS,
  },
};

/** The layout of a settlement as fractions, or null when it has no painted map. */
export const layoutFor = (id) => TOWN_LAYOUTS[id] || null;
