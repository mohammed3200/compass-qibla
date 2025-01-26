import React, { useEffect, useState } from "react";
import * as Location from "expo-location";
import { Text, View } from "react-native";
import { Image } from "expo-image";
import { icons, LocationOfMecca } from "@/constants";
import { Magnetometer } from "expo-sensors";
import CompassHeading from 'react-native-compass-heading';

export default function Page() {
  const [location, setLocation] = useState({ latitude: 0, longitude: 0 });
  const [qiblaAngle, setQiblaAngle] = useState(0);
  const [compassHeading, setCompassHeading] = useState(0);
  const [heading, setHeading] = useState(0);


  // Get location permissions and watch for location updates
  useEffect(() => {
    const getPermissions = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Please grant location permissions");
        return;
      }

      const locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Highest,
          timeInterval: 1000,
          distanceInterval: 7,
        },
        (newLocation) => {
          setLocation({
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
          });
        }
      );

      return () => {
        if (locationSubscription) {
          locationSubscription.remove();
        }
      };
    };

    getPermissions();
  }, []);

  // Calculate Qibla direction based on location
  useEffect(() => {
    const CalculateTheDirectionOfTheQibla = () => {
      const Q =
        (180.0 / Math.PI) *
        Math.atan2(
          Math.sin(
            (LocationOfMecca.longitude * Math.PI) / 180.0 -
              (location.longitude * Math.PI) / 180.0
          ),
          Math.cos((location.latitude * Math.PI) / 180.0) *
            Math.tan((LocationOfMecca.latitude * Math.PI) / 180.0) -
            Math.sin((location.latitude * Math.PI) / 180.0) *
              Math.cos(
                (LocationOfMecca.longitude * Math.PI) / 180.0 -
                  (location.longitude * Math.PI) / 180.0
              )
        );
      setQiblaAngle(Q + 180);
    };

    CalculateTheDirectionOfTheQibla();
  }, [location]);

  // Subscribe to magnetometer updates for compass heading
  useEffect(() => {
    const subscription = Magnetometer.addListener((data) => {
      const { x, y } = data;
      const angle = Math.atan2(y, x) * (180 / Math.PI);
      setCompassHeading(angle >= 0 ? angle : angle + 360);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const updateHeading = (data) => {
      setHeading(data.heading);
    };

    const options = { frequency: 1000 };
    const headingID = CompassHeading.start(options, updateHeading);
    
    return () => {
      CompassHeading.stop(headingID);
    };
  },[])

  // Calculate the rotation angle for the Qiblah arrow
  const qiblaRotationAngle = (qiblaAngle - compassHeading + 360) % 360;

  return (
    <View className="flex flex-1 items-center justify-center bg-black">
      <View className="flex flex-col items-center gap-4">
        {/* Qiblah Arrow */}
        <Image
          source={icons.CompassQibla} // Use an arrow image for Qiblah
          alt="qibla-arrow"
          testID="qibla-arrow" // Add testID for testing
          style={{
            width: 300,
            height: 300,
            transform: [{ rotate: `${qiblaRotationAngle}deg` }], // Corrected rotation
            objectFit: "contain",
          }}
        />

        {/* North Arrow */}
        <Image
          source={icons.CompassNorth} // Use an arrow image for North
          alt="north-arrow"
          testID="north-arrow" // Add testID for testing
          style={{
            width: 300,
            height: 300,
            transform: [{ rotate: `${compassHeading}deg` }], // Rotate to point North
            objectFit: "contain",
          }}
        />

        {/* Display Qibla and Compass Angles */}
        <Text className="font-semibold text-lg text-gray-200">
          Qibla Angle: {qiblaRotationAngle.toFixed(2)}°
        </Text>
        <Text className="font-semibold text-lg text-gray-200">
          Compass Heading: {compassHeading.toFixed(2)}°
        </Text>
        <Text className="font-semibold text-lg text-gray-200">
          Compass Heading: {heading.toFixed(2)}°
        </Text>
      </View>
    </View>
  );
}
