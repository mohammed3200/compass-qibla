import React, { useEffect, useState } from "react";
import * as Location from "expo-location";
import { Text, View } from "react-native";
import { Image } from "expo-image";
import { icons, LocationOfMecca } from "@/constants";
import { Magnetometer } from "expo-sensors";

export default function Page() {
  const [location, setLocation] = useState({ latitude: 0, longitude: 0 });
  const [qiblaAngle, setQiblaAngle] = useState(0);
  const [compassHeading, setCompassHeading] = useState(0);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [error, setError] = useState("");

  // Get location permissions and watch for location updates
  useEffect(() => {
    const getPermissions = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setError("الرجاء منح صلاحيات الموقع");
          return;
        }
        setHasPermissions(true);

        // Get initial location
        let currentLocation = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });

        // Watch for location updates
        const locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (newLocation) => {
            setLocation({
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
            });
          }
        );

        return () => locationSubscription?.remove();
      } catch (err) {
        setError("حدث خطأ في جلب الموقع");
        console.error(err);
      }
    };

    getPermissions();
  }, []);

  // Calculate Qibla direction based on location
  useEffect(() => {
    if (!hasPermissions || !location.latitude || !location.longitude) return;

    const calculateQiblaDirection = () => {
      try {
        // Convert degrees to radians
        const phiK = (LocationOfMecca.latitude * Math.PI) / 180.0;
        const lambdaK = (LocationOfMecca.longitude * Math.PI) / 180.0;
        const phi = (location.latitude * Math.PI) / 180.0;
        const lambda = (location.longitude * Math.PI) / 180.0;

        // Calculate Qibla direction using spherical trigonometry
        const qiblaDirection = Math.atan2(
          Math.sin(lambdaK - lambda),
          Math.cos(phi) * Math.tan(phiK) - 
          Math.sin(phi) * Math.cos(lambdaK - lambda)
        );

        // Convert to degrees and normalize to 0-360
        let qiblaDegrees = (qiblaDirection * 180.0 / Math.PI + 360) % 360;
        setQiblaAngle(qiblaDegrees);
      } catch (err) {
        setError("حدث خطأ في حساب اتجاه القبلة");
        console.error(err);
      }
    };

    calculateQiblaDirection();
  }, [location, hasPermissions]);

  // Subscribe to magnetometer updates for device orientation
  useEffect(() => {
    if (!hasPermissions) return;

    Magnetometer.setUpdateInterval(100);
    const subscription = Magnetometer.addListener((data) => {
      const { x, y } = data;
      // Calculate device orientation angle
      let angle = Math.atan2(y, x) * (180 / Math.PI);
      // Adjust for device rotation and normalize to 0-360
      angle = (angle + 360 + 90) % 360; // Added 90 degrees compensation
      setCompassHeading(angle);
    });

    return () => subscription.remove();
  }, [hasPermissions]);

  // Calculate how much the Qibla arrow should rotate
  const arrowRotation = (qiblaAngle - compassHeading + 180) % 360;

  return (
    <View className="flex flex-1 items-center justify-center bg-black">
      {error ? (
        <Text className="text-red-500 text-lg">{error}</Text>
      ) : (
        <View className="flex flex-col items-center gap-8">
          {/* Qibla Compass */}
          <View style={{ width: 300, height: 300 }}>
            {/* Compass Background (optional) */}
            <Image
              source={icons.CompassNorth}
              style={{
                width: "100%",
                height: "100%",
                position: "absolute",
              }}
            />
            
            {/* Qibla Arrow */}
            <Image
              source={icons.CompassQibla}
              style={{
                width: "100%",
                height: "100%",
                transform: [{ rotate: `${arrowRotation}deg` }],
              }}
            />
          </View>

          {/* Qibla Information */}
          <View className="items-center">
            <Text className="text-white text-2xl font-bold">
              اتجاه القبلة: {arrowRotation.toFixed(1)}°
            </Text>
            <Text className="text-gray-400 mt-2">
              {getQiblaDirectionText(arrowRotation)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

// Helper function to get textual direction
function getQiblaDirectionText(angle) {
  const directions = [
    "شمال", "شمال شرقي", "شرق", "جنوب شرقي",
    "جنوب", "جنوب غربي", "غرب", "شمال غربي"
  ];
  const index = Math.round(angle / 45) % 8;
  return directions[index];
}