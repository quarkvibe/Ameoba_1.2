/**
 * Swiss Ephemeris Astronomy Service
 * 
 * This service provides comprehensive astronomical calculations using the
 * Swiss Ephemeris library. It calculates planetary positions, lunar phases,
 * aspects, and other astronomical conditions for enhanced horoscope generation.
 */

import path from 'path';

// Import astronomy calculation libraries
let Astronomy: any = null;
let sweph: any = null;

try {
  // Try to import astronomy-engine for high-precision calculations
  Astronomy = require('astronomy-engine');
  console.log('✅ Astronomy Engine initialized successfully');
} catch (error) {
  console.warn('⚠️  Astronomy Engine not available:', error instanceof Error ? error.message : String(error));
}

try {
  // Try to import Swiss Ephemeris if available
  sweph = require('sweph');
  const ephemerisPath = path.join(process.cwd(), 'ephemeris_data');
  sweph.set_ephe_path(ephemerisPath);
  console.log('✅ Swiss Ephemeris initialized successfully');
  console.log('📁 Ephemeris path:', ephemerisPath);
  console.log('📊 Swiss Ephemeris version:', sweph.version());
} catch (error) {
  console.warn('⚠️  Swiss Ephemeris not available:', error instanceof Error ? error.message : String(error));
}

console.log('🔄 Using', Astronomy ? 'Astronomy Engine' : 'mathematical approximations', 'for astronomical calculations');

// Celestial body constants
export const CELESTIAL_BODIES = {
  SUN: 0,
  MOON: 1,
  MERCURY: 2,
  VENUS: 3,
  MARS: 4,
  JUPITER: 5,
  SATURN: 6,
  URANUS: 7,
  NEPTUNE: 8,
  PLUTO: 9,
  MEAN_NODE: 10,   // North Node
  TRUE_NODE: 11,   // True Node
  MEAN_APOG: 12,   // Lilith
  CHIRON: 15,      // Chiron
  // Additional points
  ASCENDING_NODE: 10,
  DESCENDING_NODE: -10
} as const;

export const PLANET_NAMES: Record<number, string> = {
  0: 'Sun',
  1: 'Moon', 
  2: 'Mercury',
  3: 'Venus',
  4: 'Mars',
  5: 'Jupiter',
  6: 'Saturn',
  7: 'Uranus',
  8: 'Neptune',
  9: 'Pluto',
  10: 'North Node',
  11: 'True Node',
  12: 'Lilith',
  15: 'Chiron'
};

export const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

export const ASPECTS = {
  CONJUNCTION: 0,      // 0°
  SEXTILE: 60,        // 60°
  SQUARE: 90,         // 90°
  TRINE: 120,         // 120°
  OPPOSITION: 180     // 180°
} as const;

export interface PlanetPosition {
  name: string;
  longitude: number;
  latitude: number;
  distance: number;
  speed: number;
  zodiacSign: string;
  zodiacDegree: number;
  house?: number;
}

export interface AspectData {
  planet1: string;
  planet2: string;
  aspect: string;
  orb: number;
  exactness: number; // How close to exact (0-100%)
}

export interface LunarPhase {
  name: string;
  illumination: number; // Percentage illuminated
  phase: number; // Phase angle
  nextNewMoon: Date;
  nextFullMoon: Date;
  currentPhase: 'New' | 'Waxing Crescent' | 'First Quarter' | 'Waxing Gibbous' | 'Full' | 'Waning Gibbous' | 'Last Quarter' | 'Waning Crescent';
}

export interface AstronomicalData {
  date: Date;
  julianDay: number;
  planetPositions: PlanetPosition[];
  aspects: AspectData[];
  lunarPhase: LunarPhase;
  transits: any[]; // Placeholder for transit calculations
  houses?: number[]; // House cusps if location provided
}

export class AstronomyService {
  private isSwephAvailable: boolean;

  constructor() {
    this.isSwephAvailable = sweph !== null;
    console.log(`🌟 Astronomy Service initialized with ${this.getCalculationMethod()}`);
  }

  private getCalculationMethod(): string {
    if (sweph) return 'Swiss Ephemeris (High Precision)';
    if (Astronomy) return 'Astronomy Engine (High Precision)';
    return 'Mathematical Approximations (Basic)';
  }

  /**
   * Calculate Julian Day from date
   */
  private calculateJulianDay(date: Date): number {
    if (this.isSwephAvailable) {
      return sweph.julday(
        date.getFullYear(),
        date.getMonth() + 1, // JavaScript months are 0-indexed
        date.getDate(),
        date.getHours() + (date.getMinutes() / 60) + (date.getSeconds() / 3600),
        sweph.SE_GREG_CAL
      );
    } else {
      // Fallback calculation for Julian Day
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate() + (date.getHours() / 24) + (date.getMinutes() / 1440);
      
      let a = Math.floor((14 - month) / 12);
      let y = year + 4800 - a;
      let m = month + 12 * a - 3;
      
      return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) 
             - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    }
  }

  /**
   * Convert longitude to zodiac sign and degree
   */
  private longitudeToZodiac(longitude: number): { sign: string; degree: number } {
    const normalizedLongitude = ((longitude % 360) + 360) % 360;
    const signIndex = Math.floor(normalizedLongitude / 30);
    const degree = normalizedLongitude % 30;
    
    return {
      sign: ZODIAC_SIGNS[signIndex],
      degree: degree
    };
  }

  /**
   * Calculate planetary positions for a given date
   */
  async calculatePlanetaryPositions(date: Date): Promise<PlanetPosition[]> {
    const positions: PlanetPosition[] = [];

    if (this.isSwephAvailable) {
      // Use Swiss Ephemeris for highest precision
      return this.calculateWithSwissEphemeris(date);
    } else if (Astronomy) {
      // Use Astronomy Engine for high precision
      return this.calculateWithAstronomyEngine(date);
    } else {
      // Use mathematical approximations
      return this.calculateWithApproximations(date);
    }
  }

  private async calculateWithSwissEphemeris(date: Date): Promise<PlanetPosition[]> {
    const positions: PlanetPosition[] = [];
    const julianDay = this.calculateJulianDay(date);
    
    const planets = [
      CELESTIAL_BODIES.SUN,
      CELESTIAL_BODIES.MOON,
      CELESTIAL_BODIES.MERCURY,
      CELESTIAL_BODIES.VENUS,
      CELESTIAL_BODIES.MARS,
      CELESTIAL_BODIES.JUPITER,
      CELESTIAL_BODIES.SATURN,
      CELESTIAL_BODIES.URANUS,
      CELESTIAL_BODIES.NEPTUNE,
      CELESTIAL_BODIES.PLUTO,
      CELESTIAL_BODIES.MEAN_NODE,
      CELESTIAL_BODIES.CHIRON
    ];

    for (const planetId of planets) {
      try {
        const result = sweph.calc_ut(julianDay, planetId, sweph.SEFLG_SWIEPH | sweph.SEFLG_SPEED);
        
        if (!result.error) {
          const zodiac = this.longitudeToZodiac(result.longitude);
          positions.push({
            name: PLANET_NAMES[planetId] || `Planet ${planetId}`,
            longitude: result.longitude,
            latitude: result.latitude,
            distance: result.distance,
            speed: result.longitudeSpeed,
            zodiacSign: zodiac.sign,
            zodiacDegree: zodiac.degree
          });
        }
      } catch (error) {
        console.warn(`Failed to calculate position for ${PLANET_NAMES[planetId]}:`, error instanceof Error ? error.message : String(error));
      }
    }
    
    return positions;
  }

  private async calculateWithAstronomyEngine(date: Date): Promise<PlanetPosition[]> {
    const positions: PlanetPosition[] = [];
    
    try {
      const observer = new Astronomy.Observer(0, 0, 0); // Geocentric observer
      const time = new Astronomy.AstroTime(date);
      
      const bodies = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
      
      for (const bodyName of bodies) {
        try {
          const equatorial = Astronomy.Equator(bodyName, time, observer, true, true);
          const ecliptic = Astronomy.Ecliptic(equatorial);
          
          const zodiac = this.longitudeToZodiac(ecliptic.elon);
          positions.push({
            name: bodyName,
            longitude: ecliptic.elon,
            latitude: ecliptic.elat,
            distance: equatorial.dist,
            speed: 0, // TODO: Calculate speed
            zodiacSign: zodiac.sign,
            zodiacDegree: zodiac.degree
          });
        } catch (error) {
          console.warn(`Failed to calculate ${bodyName}:`, error instanceof Error ? error.message : String(error));
        }
      }
      
      return positions;
    } catch (error) {
      console.warn('Astronomy Engine calculation failed, falling back to approximations');
      return this.calculateWithApproximations(date);
    }
  }

  private calculateWithApproximations(date: Date): PlanetPosition[] {
    // Enhanced mathematical approximations
    return this.calculateEnhancedPositions(date);
  }

  /**
   * Enhanced planetary position calculations using Meeus algorithms
   */
  private calculateEnhancedPositions(date: Date): PlanetPosition[] {
    const jd = this.calculateJulianDay(date);
    const T = (jd - 2451545.0) / 36525; // Julian centuries from J2000.0
    
    const positions: PlanetPosition[] = [];
    
    // Sun's apparent geocentric longitude (Meeus, Chapter 25)
    const sunLongitude = this.calculateSunLongitude(T);
    const sunZodiac = this.longitudeToZodiac(sunLongitude);
    positions.push({
      name: 'Sun',
      longitude: sunLongitude,
      latitude: 0,
      distance: 1.0,
      speed: 0.985647,
      zodiacSign: sunZodiac.sign,
      zodiacDegree: sunZodiac.degree
    });
    
    // Moon's apparent geocentric longitude (Meeus, Chapter 47)
    const moonData = this.calculateMoonPosition(T);
    const moonZodiac = this.longitudeToZodiac(moonData.longitude);
    positions.push({
      name: 'Moon',
      longitude: moonData.longitude,
      latitude: moonData.latitude,
      distance: moonData.distance,
      speed: 13.176396,
      zodiacSign: moonZodiac.sign,
      zodiacDegree: moonZodiac.degree
    });
    
    // Mercury (simplified VSOP87 approximation)
    const mercuryLongitude = this.calculatePlanetLongitude('mercury', T);
    const mercuryZodiac = this.longitudeToZodiac(mercuryLongitude);
    positions.push({
      name: 'Mercury',
      longitude: mercuryLongitude,
      latitude: 0,
      distance: 0.39,
      speed: 4.092,
      zodiacSign: mercuryZodiac.sign,
      zodiacDegree: mercuryZodiac.degree
    });
    
    // Venus
    const venusLongitude = this.calculatePlanetLongitude('venus', T);
    const venusZodiac = this.longitudeToZodiac(venusLongitude);
    positions.push({
      name: 'Venus',
      longitude: venusLongitude,
      latitude: 0,
      distance: 0.72,
      speed: 1.602,
      zodiacSign: venusZodiac.sign,
      zodiacDegree: venusZodiac.degree
    });
    
    // Mars
    const marsLongitude = this.calculatePlanetLongitude('mars', T);
    const marsZodiac = this.longitudeToZodiac(marsLongitude);
    positions.push({
      name: 'Mars',
      longitude: marsLongitude,
      latitude: 0,
      distance: 1.52,
      speed: 0.524,
      zodiacSign: marsZodiac.sign,
      zodiacDegree: marsZodiac.degree
    });
    
    // Outer planets with basic approximations
    const jupiterLongitude = this.calculatePlanetLongitude('jupiter', T);
    const jupiterZodiac = this.longitudeToZodiac(jupiterLongitude);
    positions.push({
      name: 'Jupiter',
      longitude: jupiterLongitude,
      latitude: 0,
      distance: 5.20,
      speed: 0.083,
      zodiacSign: jupiterZodiac.sign,
      zodiacDegree: jupiterZodiac.degree
    });
    
    return positions;
  }

  private calculateSunLongitude(T: number): number {
    // Sun's mean longitude
    const L0 = 280.4664567 + 36000.76982779 * T + 0.0003032 * T * T;
    
    // Sun's mean anomaly
    const M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T;
    
    // Equation of center
    const C = (1.9146 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M * Math.PI / 180) +
              (0.019993 - 0.000101 * T) * Math.sin(2 * M * Math.PI / 180) +
              0.00029 * Math.sin(3 * M * Math.PI / 180);
    
    // Sun's true longitude
    const longitude = (L0 + C) % 360;
    return longitude < 0 ? longitude + 360 : longitude;
  }

  private calculateMoonPosition(T: number): { longitude: number; latitude: number; distance: number } {
    // Moon's mean longitude
    const Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T;
    
    // Moon's mean elongation
    const D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T;
    
    // Sun's mean anomaly
    const M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T;
    
    // Moon's mean anomaly
    const Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T * T;
    
    // Moon's argument of latitude
    const F = 93.272095 + 483202.0175233 * T - 0.0036539 * T * T;
    
    // Simplified longitude calculation (major terms only)
    const longitude = (Lp + 
                     6.289 * Math.sin(Mp * Math.PI / 180) +
                     1.274 * Math.sin((2 * D - Mp) * Math.PI / 180) +
                     0.658 * Math.sin(2 * D * Math.PI / 180) +
                     0.214 * Math.sin(2 * Mp * Math.PI / 180)) % 360;
    
    // Simplified latitude calculation
    const latitude = 5.128 * Math.sin(F * Math.PI / 180) +
                    0.281 * Math.sin((Mp + F) * Math.PI / 180);
    
    // Simplified distance calculation (in Earth radii)
    const distance = 60.2666 / (1 + 0.0549 * Math.cos(Mp * Math.PI / 180));
    
    return {
      longitude: longitude < 0 ? longitude + 360 : longitude,
      latitude,
      distance
    };
  }

  private calculatePlanetLongitude(planet: string, T: number): number {
    // Simplified planetary longitude calculations
    // These are very basic approximations - not suitable for precise astrology
    const planetData: Record<string, { meanLongitude: number; dailyMotion: number }> = {
      mercury: { meanLongitude: 252.25084, dailyMotion: 4.092317 },
      venus: { meanLongitude: 181.97973, dailyMotion: 1.602136 },
      mars: { meanLongitude: 355.43299, dailyMotion: 0.524033 },
      jupiter: { meanLongitude: 34.35151, dailyMotion: 0.083056 },
      saturn: { meanLongitude: 50.07744, dailyMotion: 0.033371 },
      uranus: { meanLongitude: 314.05500, dailyMotion: 0.011681 },
      neptune: { meanLongitude: 304.34867, dailyMotion: 0.006068 },
      pluto: { meanLongitude: 238.95695, dailyMotion: 0.003983 }
    };
    
    const data = planetData[planet];
    if (!data) return 0;
    
    const longitude = (data.meanLongitude + data.dailyMotion * T * 36525) % 360;
    return longitude < 0 ? longitude + 360 : longitude;
  }

  /**
   * Calculate lunar phase information
   */
  async calculateLunarPhase(date: Date): Promise<LunarPhase> {
    if (this.isSwephAvailable) {
      const julianDay = this.calculateJulianDay(date);
      
      try {
        // Calculate Sun and Moon positions
        const sunResult = sweph.calc_ut(julianDay, CELESTIAL_BODIES.SUN, sweph.SEFLG_SWIEPH);
        const moonResult = sweph.calc_ut(julianDay, CELESTIAL_BODIES.MOON, sweph.SEFLG_SWIEPH);
        
        if (!sunResult.error && !moonResult.error) {
          // Calculate phase angle
          let phaseAngle = moonResult.longitude - sunResult.longitude;
          if (phaseAngle < 0) phaseAngle += 360;
          if (phaseAngle > 180) phaseAngle = 360 - phaseAngle;
          
          // Calculate illumination percentage
          const illumination = (1 + Math.cos(phaseAngle * Math.PI / 180)) / 2;
          
          // Determine phase name
          let currentPhase: LunarPhase['currentPhase'] = 'New';
          if (phaseAngle < 45) currentPhase = 'New';
          else if (phaseAngle < 90) currentPhase = 'Waxing Crescent';
          else if (phaseAngle < 135) currentPhase = 'First Quarter';
          else if (phaseAngle < 180) currentPhase = 'Waxing Gibbous';
          else if (phaseAngle < 225) currentPhase = 'Full';
          else if (phaseAngle < 270) currentPhase = 'Waning Gibbous';
          else if (phaseAngle < 315) currentPhase = 'Last Quarter';
          else currentPhase = 'Waning Crescent';
          
          return {
            name: currentPhase,
            illumination: illumination * 100,
            phase: phaseAngle,
            nextNewMoon: new Date(date.getTime() + 29.5 * 24 * 60 * 60 * 1000), // Approximate
            nextFullMoon: new Date(date.getTime() + 14.8 * 24 * 60 * 60 * 1000), // Approximate
            currentPhase
          };
        }
      } catch (error) {
        console.warn('Failed to calculate lunar phase with Swiss Ephemeris:', error instanceof Error ? error.message : String(error));
      }
    }

    // Fallback lunar phase calculation
    return this.calculateBasicLunarPhase(date);
  }

  /**
   * Basic lunar phase calculation (fallback)
   */
  private calculateBasicLunarPhase(date: Date): LunarPhase {
    const cycleLength = 29.5305882; // Average lunar cycle length in days
    const knownNewMoon = new Date('2024-01-11T11:57:00Z'); // A known new moon
    
    const daysSinceNewMoon = (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
    const cyclePosition = ((daysSinceNewMoon % cycleLength) + cycleLength) % cycleLength;
    
    const phaseAngle = (cyclePosition / cycleLength) * 360;
    const illumination = (1 - Math.cos(phaseAngle * Math.PI / 180)) / 2;
    
    let currentPhase: LunarPhase['currentPhase'] = 'New';
    if (cyclePosition < 1.85) currentPhase = 'New';
    else if (cyclePosition < 5.53) currentPhase = 'Waxing Crescent';
    else if (cyclePosition < 9.21) currentPhase = 'First Quarter';
    else if (cyclePosition < 12.89) currentPhase = 'Waxing Gibbous';
    else if (cyclePosition < 16.57) currentPhase = 'Full';
    else if (cyclePosition < 20.25) currentPhase = 'Waning Gibbous';
    else if (cyclePosition < 23.93) currentPhase = 'Last Quarter';
    else currentPhase = 'Waning Crescent';
    
    return {
      name: currentPhase,
      illumination: illumination * 100,
      phase: phaseAngle,
      nextNewMoon: new Date(knownNewMoon.getTime() + Math.ceil(daysSinceNewMoon / cycleLength + 1) * cycleLength * 24 * 60 * 60 * 1000),
      nextFullMoon: new Date(knownNewMoon.getTime() + (Math.ceil(daysSinceNewMoon / cycleLength) * cycleLength + cycleLength / 2) * 24 * 60 * 60 * 1000),
      currentPhase
    };
  }

  /**
   * Calculate aspects between planets
   */
  async calculateAspects(positions: PlanetPosition[]): Promise<AspectData[]> {
    const aspects: AspectData[] = [];
    const orbTolerance = 8; // Degrees of orb tolerance

    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const planet1 = positions[i];
        const planet2 = positions[j];
        
        let angleDiff = Math.abs(planet1.longitude - planet2.longitude);
        if (angleDiff > 180) angleDiff = 360 - angleDiff;
        
        // Check for each major aspect
        for (const [aspectName, aspectAngle] of Object.entries(ASPECTS)) {
          const orb = Math.abs(angleDiff - aspectAngle);
          
          if (orb <= orbTolerance) {
            aspects.push({
              planet1: planet1.name,
              planet2: planet2.name,
              aspect: aspectName.toLowerCase().replace('_', ' '),
              orb: orb,
              exactness: Math.max(0, 100 - (orb / orbTolerance) * 100)
            });
          }
        }
      }
    }

    return aspects.sort((a, b) => a.orb - b.orb); // Sort by exactness
  }

  /**
   * Get comprehensive astronomical data for a given date
   */
  async getAstronomicalData(date: Date = new Date()): Promise<AstronomicalData> {
    try {
      const julianDay = this.calculateJulianDay(date);
      const planetPositions = await this.calculatePlanetaryPositions(date);
      const aspects = await this.calculateAspects(planetPositions);
      const lunarPhase = await this.calculateLunarPhase(date);

      return {
        date,
        julianDay,
        planetPositions,
        aspects,
        lunarPhase,
        transits: [], // TODO: Implement transit calculations
        houses: undefined // TODO: Implement house calculations with location
      };
    } catch (error) {
      console.error('Failed to calculate astronomical data:', error);
      throw new Error(`Astronomical calculation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get current astronomical conditions summary
   */
  async getCurrentConditions(): Promise<string> {
    try {
      const data = await this.getAstronomicalData();
      
      const sunPosition = data.planetPositions.find(p => p.name === 'Sun');
      const moonPosition = data.planetPositions.find(p => p.name === 'Moon');
      
      let summary = `🌟 Current Astronomical Conditions:\n`;
      summary += `📅 Date: ${data.date.toISOString().split('T')[0]}\n`;
      summary += `🌞 Sun in ${sunPosition?.zodiacSign} (${sunPosition?.zodiacDegree.toFixed(1)}°)\n`;
      summary += `🌙 Moon in ${moonPosition?.zodiacSign} (${moonPosition?.zodiacDegree.toFixed(1)}°)\n`;
      summary += `🌕 Lunar Phase: ${data.lunarPhase.currentPhase} (${data.lunarPhase.illumination.toFixed(1)}% illuminated)\n`;
      
      if (data.aspects.length > 0) {
        summary += `⭐ Major Aspects:\n`;
        data.aspects.slice(0, 3).forEach(aspect => {
          summary += `  • ${aspect.planet1} ${aspect.aspect} ${aspect.planet2} (orb: ${aspect.orb.toFixed(1)}°)\n`;
        });
      }

      return summary;
    } catch (error) {
      return `⚠️ Unable to calculate current astronomical conditions: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /**
   * Check if Swiss Ephemeris is available
   */
  isSwissEphemerisAvailable(): boolean {
    return this.isSwephAvailable;
  }
}

// Export singleton instance
export const astronomyService = new AstronomyService();