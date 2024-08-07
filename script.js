/*
 * Planets array
 * size - radius of the planet in km
 * distance - distance of the planet from the sun in AU
 * speed - time taken to complete one revolution around the sun in hours
 */
const CONFIG = {
    secure_area: 0.05,
    sun_px: 150,
    planets: {
        mercury: {
            radius: 2439.7,
            distance: 5,
            real_distance: 0.39,
            angle: 300,
            sidereal_year: 88 * 86400,
            sidereal_day: 58.65 * 86400
        },
        venus: {
            radius: 6051.8,
            distance: 10,
            real_distance: 0.72,
            angle: 270,
            sidereal_year: 224.701 * 86400,
            sidereal_day: 243 * 86400
        },
        earth: {
            radius: 6371,
            distance: 15,
            real_distance: 1,
            angle: 105,
            sidereal_year: 365.256 * 86400,
            sidereal_day: 23.934 * 86400
        },
        jupiter: {
            radius: 69911,
            distance: 25,
            real_distance: 5.2,
            angle: 210,
            sidereal_year: 4332.59 * 86400,
            sidereal_day: 9.925 * 3600
        },
        mars: {
            radius: 3389.5,
            distance: 20,
            real_distance: 1.52,
            angle: 345,
            sidereal_year: 687 * 86400,
            sidereal_day: 24 * 3600 + 37 * 60 + 22
        },
        saturn: {
            radius: 58232,
            distance: 30,
            real_distance: 9.58,
            angle: 30,
            sidereal_year: 10759.22 * 86400,
            sidereal_day: 10.7 * 3600
        },
        uranus: {
            radius: 25362,
            distance: 35,
            real_distance: 19.22,
            angle: 195,
            sidereal_year: 84 * 365 * 86400 + 16 * 3600,
            sidereal_day: 17 * 3600 + 14 * 60 + 24
        },
        neptune: {
            radius: 24622,
            distance: 40,
            real_distance: 30.05,
            angle: 240,
            sidereal_year: 164 * 365 * 86400 + 288 * 86400,
            sidereal_day: 15 * 86400 + 57 * 3600 + 59
        },
    },
    moon: {
        radius: 1737.4,
        distance: 2.5,
        angle: 0,
        real_distance: 0.002639,
        sidereal_month: 2360592
    }
};

// 
// CONFIG END
// 
const SUN_SIZE = 696340;
const MAX_ZOOM = 50;
const FPS = 30;
const APHEL_DISTANCE = 30.385 * 149597870; // Aphel distance of Neptune in KM

var system_center = {
    x: 0,
    y: 0
};
var settings = {
    "realisticDistance": false,
    "planet_size_factor": 5,
    "draw_orbits": false,
    "earthMoon": false
};
var zoom_factor = 1;
var move_x = 0;
var move_y = 0;
var planets = [];
var moon;
var system_diameter;
var time = 0; // Time is unix timestamp
var time_per_second = 86400;
var sun_px;

function init(noreset = false) {

    // Copy config planets to planets array
    planets = JSON.parse(JSON.stringify(CONFIG.planets));

    // Copy moon
    moon = JSON.parse(JSON.stringify(CONFIG.moon));

    // Query window size
    var window_width = window.innerWidth;
    var window_height = window.innerHeight;
    system_center = { x: window_width / 2, y: window_height / 2 };

    // Set sun size
    sun_px = settings.realisticDistance
        ? Math.min(window_width, window_height) * (1 - CONFIG.secure_area) / 2 * SUN_SIZE / APHEL_DISTANCE
        : CONFIG.sun_px;

    // Calculate planet sizes
    for (var p in planets) {
        planets[p].radius = planets[p].radius / SUN_SIZE * sun_px * settings.planet_size_factor;
        document.getElementById(p).style.width = planets[p].radius + 'px';
    }

    // Get biggest planet size by px
    var biggest_planet = 0;
    for (var p in planets) {
        biggest_planet = Math.max(biggest_planet, planets[p].radius);
    }

    // Calculate system radius
    system_diameter = Math.min(window_width, window_height) * (1 - CONFIG.secure_area) - (biggest_planet / 2);
    document.getElementsByTagName('main')[0].style.width = system_diameter + 'px';
    document.getElementsByTagName('main')[0].style.height = system_diameter + 'px';

    // Set sun size
    document.getElementById('sun').style.width = sun_px + 'px';
    document.getElementById('sun').style.height = sun_px + 'px';

    // Calculate planet distances
    var max_distance = Math.max(...Object.keys(CONFIG.planets).map(planet => settings.realisticDistance ? CONFIG.planets[planet].real_distance : CONFIG.planets[planet].distance));
    for (var p in planets) {
        planets[p].distance_px = (settings.realisticDistance ? planets[p].real_distance : planets[p].distance) / max_distance * (system_diameter / 2 - sun_px / 2) + (sun_px / 2);
    }
    moon.distance_px = (settings.realisticDistance ? moon.real_distance : moon.distance) / max_distance * (system_diameter / 2 - sun_px / 2);

    positionPlanets();

    // Reset time to 01.01.1970 00:00
    if (!noreset) time = 0;
}
init();

function positionPlanets() {
    // All planets
    for (var planet in planets) {
        var planet_element = document.getElementById(planet);
        planets[planet].x = Math.cos(planets[planet].angle * (Math.PI / 180)) * planets[planet].distance_px;
        planets[planet].y = Math.sin(planets[planet].angle * (Math.PI / 180)) * planets[planet].distance_px;
        // Zoom factor
        planets[planet].x *= zoom_factor;
        planets[planet].y *= zoom_factor;
        planet_element.style.width = planets[planet].radius * zoom_factor + 'px';
        // Move system
        planets[planet].x += move_x;
        planets[planet].y += move_y;
        document.getElementById("sun").style.transform = 'translate(' + move_x + 'px, ' + move_y + 'px) scale(' + zoom_factor + ')';
        // Set planet position
        planet_element.style.transform = 'translate(' + planets[planet].x + 'px, ' + planets[planet].y + 'px)';
    }
    // Moon
    if (settings.earthMoon) {
        // Set moonsize
        document.getElementById("moon").style.width = planets["earth"].radius / CONFIG.planets["earth"].radius * CONFIG.moon.radius * zoom_factor + "px";
        // Set moon position
        var x = Math.cos(moon.angle * (Math.PI / 180)) * moon.distance_px;
        var y = Math.sin(moon.angle * (Math.PI / 180)) * moon.distance_px;
        document.getElementById("moon").style.transform = 'translate(' + x + "px, " + y + "px)";
        // Set moon-container position
        document.getElementsByClassName("moon")[0].style.transform = 'translate(' + planets["earth"].x + 'px, ' + planets["earth"].y + 'px)';
    }
}

function timeToPositions() {
    for (planet in planets) {
        // Remove time overhead
        angle = (time % planets[planet].sidereal_year);
        // Get revolution percentage
        angle /= planets[planet].sidereal_year;
        // Percentage to degrees
        angle *= 360;
        // Add starting angle
        angle += CONFIG.planets[planet].angle;
        // Set angle
        planets[planet].angle = angle;
    }
    // Moon
    if (settings.earthMoon) {
        moon.angle = (time % moon.sidereal_month);
        moon.angle /= moon.sidereal_month;
        moon.angle *= 360
        moon.angle += CONFIG.moon.angle;
    }
    positionPlanets();
}

function tick() {
    // Advance time
    time += time_per_second / FPS;
    // Calculate planet angles
    timeToPositions(time);
    // Set day overlay
    const date = new Date(time * 1000);
    var timeD = date.getDate();
    var timeM = date.getMonth() + 1;
    var timeY = date.getFullYear();
    timeD = timeD.toString().length < 2 ? "0" + timeD : timeD;
    timeM = timeM.toString().length < 2 ? "0" + timeM : timeM;
    document.getElementById("date").innerText = timeD + "." + timeM + "." + timeY;
}

// Button actions
var loopInterval;
function pausePlay() {
    if (loopInterval) { clearInterval(loopInterval); loopInterval = undefined; }
    else loopInterval = setInterval(tick, 1000 / FPS);
    // Set button
    loopInterval ? document.getElementById("startPause").classList.add("active") : document.getElementById("startPause").classList.remove("active");
}
function setTimeFactor(factor, e) {
    time_per_second = 86400 * factor;
    last_btn = document.getElementsByClassName("timeFactorActive")[0].classList.remove("timeFactorActive");
    e.classList.add("timeFactorActive");
}

// Re-Init on resize
window.addEventListener('resize', () => init(true));

// Zoom (scroll)
window.addEventListener('wheel', (e) => {
    // Check if settings are open
    if (document.getElementById("overlay-settings").style.display === "grid") return;
    // Adjust zoom factor
    if (e.deltaY < 0) { if (zoom_factor < MAX_ZOOM) zoom_factor *= 1.25 }
    else if (zoom_factor > 1) zoom_factor /= 1.25;
    positionPlanets();
    orbits();
});
// Movement (arrow keys / wasd)
window.addEventListener('keydown', (e) => {
    // Check if settings are open
    if (document.getElementById("overlay-settings").style.display === "grid") return;
    // Check for arrow keys or wasd
    if (e.key === 'ArrowUp' || e.key === 'w') move_y += 10;
    if (e.key === 'ArrowDown' || e.key === 's') move_y -= 10;
    if (e.key === 'ArrowLeft' || e.key === 'a') move_x += 10;
    if (e.key === 'ArrowRight' || e.key === 'd') move_x -= 10;
    positionPlanets();
    orbits();
});

// 
// Settings
// 

function openSettings() {
    document.getElementById("overlay-settings").style.display = "grid";
}

function closeSettings() {
    document.getElementById("overlay-settings").style.display = "none";
}

toggleRealisticDistance = () => {
    settings.realisticDistance = !settings.realisticDistance;
    document.getElementById("settingRealisticDistance").classList = settings.realisticDistance ? "setting-on" : "setting-off";
    init(true);
    orbits();
    // Set planet sizes to default if realistic distance is being turned off
    if (!settings.realisticDistance) setPlanetSize(5, document.getElementsByClassName("planetSizeButton")[1]);
    // Check which planetSize-buttons should be disabled
    if (settings.realisticDistance) {
        document.getElementsByClassName("planetSizeButton")[2].disabled = false;
        document.getElementsByClassName("planetSizeButton")[3].disabled = false;
    } else {
        document.getElementsByClassName("planetSizeButton")[2].disabled = true;
        document.getElementsByClassName("planetSizeButton")[3].disabled = true;
    }
}
setPlanetSize = (factor, e) => {
    settings.planet_size_factor = factor;
    document.getElementsByClassName("planetSizeActive")[0].classList.remove("planetSizeActive");
    e.classList.add("planetSizeActive");
    last_btn = e;
    // Recalculate planet sizes
    init(true);
    // Reset orbits
    orbits();
}

togglePlanetOrbits = () => {
    settings.draw_orbits = !settings.draw_orbits;
    document.getElementById("settingPlanetOrbits").classList = settings.draw_orbits ? "setting-on" : "setting-off";
    orbits();
}

function orbits() {
    document.querySelectorAll(".orbit").forEach(e => e.remove());
    if (!settings.draw_orbits) return;
    for (var planet in planets) {
        // Create orbit element (div circle)
        const orbit_wrapper = document.createElement("div");
        orbit_wrapper.classList.add("orbit-wrapper");
        const orbit = document.createElement("div");
        const radius = planets[planet].distance_px;
        orbit.classList.add("orbit");
        orbit.style.width = radius * 2 * zoom_factor + "px";
        orbit.style.height = radius * 2 * zoom_factor + "px";
        orbit.style.transform = "translate(" + move_x + "px, " + move_y + "px)";
        orbit.style.borderRadius = "50%";
        orbit.style.border = "1px solid rgba(255, 255, 255, 0.25)";
        orbit_wrapper.appendChild(orbit);
        document.getElementById("orbits").appendChild(orbit_wrapper);
    }
}

toggleEarthMoon = () => {
    settings.earthMoon = !settings.earthMoon;
    document.getElementById("settingEarthMoon").classList = settings.earthMoon ? "setting-on" : "setting-off";
    document.getElementsByClassName("moon")[0].style.display = settings.earthMoon ? "grid" : "none";
    positionPlanets();
    orbits();
}

// 
// Time overlay
//
var timeOverlayOpen = false;
var preOpenPlay = false;
toggleTimeOverlay = () => {
    if (!timeOverlayOpen) preOpenPlay = !!loopInterval;
    timeOverlayOpen = !timeOverlayOpen;
    if (preOpenPlay) {
        pausePlay();
    }
    document.getElementById("overlay-time").style.display = timeOverlayOpen ? "grid" : "none";
    // If open, set time
    if (timeOverlayOpen) {
        const date = new Date(time * 1000);
        d = date.getDate();
        m = date.getMonth() + 1;
        y = date.getFullYear();
        document.getElementById("overlay-time-day").innerText = d.toString().length < 2 ? "0" + d : d;
        document.getElementById("overlay-time-month").innerText = m.toString().length < 2 ? "0" + m : m;
        document.getElementById("overlay-time-year").innerText = y;
    }
}

// 
// Shortcut keys
// 
window.addEventListener('keydown', (e) => {
    // Play/Pause
    if (e.key === " ")
        if (!timeOverlayOpen) pausePlay();
    // Time factors
    if (e.key === "1") setTimeFactor(1, document.getElementById("timeFactorButton1"));
    if (e.key === "2") setTimeFactor(10, document.getElementById("timeFactorButton2"));
    if (e.key === "3") setTimeFactor(100, document.getElementById("timeFactorButton3"));
    if (e.key === "4") setTimeFactor(365, document.getElementById("timeFactorButton4"));
    // Planet sizes
    if (e.key === "7") setPlanetSize(1, document.getElementsByClassName("planetSizeButton")[0]);
    if (e.key === "8") setPlanetSize(5, document.getElementsByClassName("planetSizeButton")[1]);
    if (settings.realisticDistance) {
        if (e.key === "9") setPlanetSize(50, document.getElementsByClassName("planetSizeButton")[2]);
        if (e.key === "0") setPlanetSize(500, document.getElementsByClassName("planetSizeButton")[3]);
    }
    // General settings
    if (e.key === "r") toggleRealisticDistance();
    if (e.key === "o") togglePlanetOrbits();
    if (e.key === "m") toggleEarthMoon();
    // t for time overlay
    if (e.key === "t") toggleTimeOverlay();
    // General ESC-key
    if (e.key === "Escape") {
        if (timeOverlayOpen) toggleTimeOverlay();
        if (document.getElementById("overlay-settings").style.display === "grid") closeSettings();
    }
});