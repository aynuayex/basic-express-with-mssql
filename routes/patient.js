const express = require("express");
const router = express.Router();

const {
  getPatient,
  getPatients,
  createPatient,
  updatePatient,
  deletePatient
} = require("../controllers/patientController")

router.get("/:id",getPatient)
  
router.get("/",getPatients)
  
router.post('/',createPatient);
router.patch('/:id',updatePatient);
  
router.delete("/:id",deletePatient)

module.exports = router;

