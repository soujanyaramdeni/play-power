import React, { useState, useEffect } from "react";
import moment from "moment-timezone";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { motion } from "framer-motion"; // Import Framer Motion
import { FaGithub as GitHubIcon, FaEnvelope as MailIcon } from "react-icons/fa";

import "./style.css";

function TimezoneSlider({ timezone, value, onChange, onRemove, selectedDate }) {
  const [hours, minutes] = [Math.floor(value / 60), value % 60];

  const handleChange = (event) => {
    const newValue = parseInt(event.target.value, 10);
    onChange(newValue);
  };

  const handleRemoveClick = (e) => {
    e.stopPropagation(); // Prevent triggering onChange for range input
    onRemove(timezone);
  };

  const formatTime = (hours, minutes) => {
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
    const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  const formatDateTime = () => {
    // Get the current date and time in the selected timezone
    const formattedDateTime = moment(selectedDate)
      .tz(timezone)
      .format("MMMM DD, YYYY");
    return formattedDateTime;
  };

  return (
    <div className="slider-wrapper">
      <div className="current-date">{formatDateTime()}</div>
      <div className="slider-header">
        <h3>{timezone}</h3>
        {timezone !== "UTC" && (
          <button className="remove-timezone" onClick={handleRemoveClick}>
            X
          </button>
        )}
      </div>
      <div style={{ position: "relative" }}>
        <input
          type="range"
          min={0}
          max={24 * 60 - 1}
          step={15}
          value={value}
          onChange={handleChange}
        />
        <p className="time-display">{formatTime(hours, minutes)}</p>
      </div>
    </div>
  );
}

function TimezoneConverter() {
  const [utcValue, setUtcValue] = useState(0);
  const [timezones, setTimezones] = useState(["IST"]);
  const [values, setValues] = useState({ IST: 0 });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [shareableInfo, setShareableInfo] = useState(null);

  useEffect(() => {
    const currentTime = new Date();
    const utcHours = currentTime.getUTCHours();
    const utcMinutes = currentTime.getUTCMinutes();
    const utcTime = utcHours * 60 + utcMinutes;
    const istTime = utcTime + 330;
    setUtcValue(utcTime);
    setValues({ IST: istTime });
  }, []);

  useEffect(() => {
    const url = window.location.href;
    const shareIndex = url.indexOf("/share/");
    if (shareIndex !== -1) {
      const shareInfo = url.substring(shareIndex + 7);
      const [timezone, formattedDateTime] = shareInfo.split("/");
      const dateTime = decodeURIComponent(
        formattedDateTime.replace(/\+/g, "%20")
      );
      setShareableInfo({ timezone, dateTime });
    }
  }, []);

  useEffect(() => {
    if (shareableInfo) {
      const { timezone, dateTime } = shareableInfo;
      const utcOffsetMinutes = moment.tz
        .zone(timezone)
        .utcOffset(new Date(dateTime));
      const selectedDateTime = moment.tz(dateTime, timezone).utc().valueOf();
      const utcTime = selectedDateTime - utcOffsetMinutes * 60 * 1000;
      setUtcValue(utcTime);
    }
  }, [shareableInfo]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleUtcChange = (value) => {
    setUtcValue(value);
    const newValues = {};

    for (const timezone of timezones) {
      let offsetMinutes;
      if (timezone === "IST") {
        offsetMinutes = 330;
      } else {
        offsetMinutes = moment.tz.zone(timezone).utcOffset(value);
      }
      let convertedTime;
      if (timezone === "IST") {
        convertedTime = value + offsetMinutes;
      } else {
        convertedTime = value - offsetMinutes;
      }
      convertedTime = ((convertedTime % (24 * 60)) + 24 * 60) % (24 * 60);
      newValues[timezone] = convertedTime;
    }
    setValues(newValues);
  };

  const handleTimezoneSelect = (timezone) => {
    if (!timezones.includes(timezone)) {
      setTimezones([...timezones, timezone]);
      const offsetMinutes = moment.tz(timezone).utcOffset();
      const convertedTime = utcValue + offsetMinutes;
      setValues({
        ...values,
        [timezone]: convertedTime < 0 ? convertedTime + 24 * 60 : convertedTime,
      });
    }
  };

  const handleTimezoneChange = (value, timezone) => {
    const newValues = { ...values, [timezone]: value };
    setValues(newValues);
  };

  const removeTimezone = (timezoneToRemove) => {
    setTimezones(timezones.filter((timezone) => timezone !== timezoneToRemove));
    const newValues = { ...values };
    delete newValues[timezoneToRemove];
    setValues(newValues);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.body.classList.toggle("dark-mode");
  };
  const handleDrop = (result) => {
    if (!result.destination) return;
    
    const { source, destination } = result;
    const reorderedTimezones = Array.from(timezones);
    
    // Remove the item from the source position
    const [movedTimezone] = reorderedTimezones.splice(source.index, 1);
    
    // Insert the item into the destination position
    reorderedTimezones.splice(destination.index, 0, movedTimezone);
    
    // Update the state with the new order
    setTimezones(reorderedTimezones);
  };
  
  const formatDateTime = (timezone) => {
    const formattedDateTime = moment()
      .tz(timezone)
      .format("YYYY-MM-DD HH:mm:ss");
    return formattedDateTime;
  };

  const handleShare = () => {
    const dateTime = formatDateTime(timezones[0]);
    const shareableText = `Check out the current date and time in ${timezones[0]}: ${dateTime}`;

    if (navigator.share) {
      navigator
        .share({
          title: "Share Current Date and Time",
          text: shareableText,
        })
        .then(() => console.log("Successfully shared"))
        .catch((error) => console.error("Error sharing:", error));
    } else {
      alert(
        "Web Share API is not supported on this browser. You can manually copy the following text to share: " +
          shareableText
      );
    }
  };

  const handleScheduleMeet = () => {
    const currentTimeUserTimezone = new Date();
    currentTimeUserTimezone.setHours(currentTimeUserTimezone.getHours() + 10);
    currentTimeUserTimezone.setMinutes(
      currentTimeUserTimezone.getMinutes() + 55
    );

    const timezoneOffsetMilliseconds =
      currentTimeUserTimezone.getTimezoneOffset() * 60 * 1000;
    const currentTimeUTC = new Date(
      currentTimeUserTimezone.getTime() + timezoneOffsetMilliseconds
    );

    const endTimeUTC = new Date(currentTimeUTC.getTime() + 2 * 60 * 60 * 1000);

    const startTimeFormatted = currentTimeUTC
      .toISOString()
      .replace(/[:\-.]/g, "")
      .slice(0, -5);
    const endTimeFormatted = endTimeUTC
      .toISOString()
      .replace(/[:\-.]/g, "")
      .slice(0, -5);

    const timezoneOffsetHours = Math.abs(
      Math.floor(currentTimeUserTimezone.getTimezoneOffset() / 60)
    )
      .toString()
      .padStart(2, "0");
    const timezoneOffsetMinutesRemainder = Math.abs(
      currentTimeUserTimezone.getTimezoneOffset() % 60
    )
      .toString()
      .padStart(2, "0");
    const timezoneOffsetSign =
      currentTimeUserTimezone.getTimezoneOffset() < 0 ? "+" : "-";
    const timezoneOffsetFormatted =
      timezoneOffsetSign + timezoneOffsetHours + timezoneOffsetMinutesRemainder;

    const googleCalendarURL = `https://calendar.google.com/calendar/u/0/r/eventedit?text=Schedule+Meet&dates=${startTimeFormatted}/${endTimeFormatted}&ctz=${timezoneOffsetFormatted}&details=Scheduled+Meeting+on+${timezoneOffsetFormatted}&location=Online`;

    window.open(googleCalendarURL, "_blank");
  };

  return (
    <DragDropContext onDragEnd={handleDrop}>
      <div
        className={`app-container ${isDarkMode ? "dark-mode" : ""}`}
        style={{ marginTop: 30 }}
      >
        <h1 className="title" style={{ margin: 50 }}>
          TIMEZONE CONVERTER
        </h1>
        <div className="container">
          <div className="timezone-selector">
            <select onChange={(e) => handleTimezoneSelect(e.target.value)}>
              <option value="">Select Timezone</option>
              {moment.tz.names().map((timezone) => (
                <option key={timezone} value={timezone}>
                  {timezone}
                </option>
              ))}
            </select>
          </div>
          <DatePicker
            placeholder="Select Date"
            className="date-picker"
            selected={selectedDate}
            onChange={handleDateChange}
          />
          <div className="dark-mode">
            <button onClick={toggleDarkMode}>
              {isDarkMode ? "Light Mode" : "Dark Mode"}
            </button>
          </div>
          <div className="share-button">
            <button onClick={handleShare}>Share</button>
          </div>
          <div className="google-meet">
            <button onClick={handleScheduleMeet}>Schedule Meeting</button>
          </div>
        </div>
        <Droppable droppableId="droppable">
    {(provided) => (
      <div
        className="sliders-container"
        ref={provided.innerRef}
        {...provided.droppableProps}
      >
        {timezones.map((timezone, index) => (
        <DragDropContext>
       <div
       ref={provided.innerRef}
       {...provided.draggableProps}
       {...provided.dragHandleProps}
     >
       <TimezoneSlider
         timezone={timezone}
         value={values[timezone]}
         onChange={handleUtcChange}
        //  onChange={(value) => handleTimezoneChange(value, timezone)}
         onRemove={removeTimezone}
         selectedDate={selectedDate}
       />
     </div>
     </DragDropContext>
        ))}
        {provided.placeholder}
      </div>
    )}
  </Droppable>
        <footer className="footer">
          <div className="footer-icons">
            <a
              href="https://github.com"
              aria-label="GitHub Profile"
              className="footer-link"
            >
              <GitHubIcon size={30} />
            </a>
            <a
              href="mailto:example@gmail.com"
              aria-label="Send Email"
              className="footer-link"
            >
              <MailIcon size={30} />
            </a>
          </div>
          <motion.p
            className="footer-text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            Made by Soujanya Ramdeni
          </motion.p>
          <motion.p
            className="footer-text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
          ></motion.p>
        </footer>
      </div>
    </DragDropContext>
  );
}

export default TimezoneConverter;