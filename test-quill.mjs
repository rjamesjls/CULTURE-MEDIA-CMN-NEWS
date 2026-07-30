import Quill from "quill";
const Parchment = Quill.import("parchment");
console.log(Object.keys(Parchment));
console.log(Parchment.Attributor ? Object.keys(Parchment.Attributor) : "No Attributor");
