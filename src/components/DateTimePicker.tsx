import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';
import './DateTimePicker.css';

interface DateTimePickerProps {
  selectedDate: string;
  selectedTime: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  // Generate time slots from 11:00 AM to 9:00 PM in 15-minute intervals
  const generateTimeSlots = () => {
    const slots: string[] = [];
    for (let hour = 11; hour <= 21; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        // Stop at 21:00 (9:00 PM)
        if (hour === 21 && minute > 0) break;

        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Format time for display (e.g., "14:30" -> "2:30 PM")
  const formatTimeDisplay = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Get calendar days for the current month
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  const handleDateSelect = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    onDateChange(`${year}-${month}-${day}`);
    setShowCalendar(false);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    const selected = new Date(selectedDate + 'T00:00:00');
    return (
      date.getDate() === selected.getDate() &&
      date.getMonth() === selected.getMonth() &&
      date.getFullYear() === selected.getFullYear()
    );
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  };

  const formatSelectedDate = () => {
    if (!selectedDate) return 'Select date';
    const date = new Date(selectedDate + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="datetime-picker">
      <div className="datetime-row">
        {/* Date Picker */}
        <div className="datetime-field">
          <label className="form-label">
            Collection Date <span className="required">*</span>
          </label>
          <div className="date-input-wrapper">
            <button
              type="button"
              className="date-input"
              onClick={() => setShowCalendar(!showCalendar)}
            >
              <Calendar size={18} />
              <span>{formatSelectedDate()}</span>
            </button>

            {showCalendar && (
              <div className="calendar-dropdown">
                <div className="calendar-header">
                  <button
                    type="button"
                    className="calendar-nav"
                    onClick={handlePreviousMonth}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="calendar-month">
                    {monthNames[currentMonth.getMonth()]}{' '}
                    {currentMonth.getFullYear()}
                  </div>
                  <button
                    type="button"
                    className="calendar-nav"
                    onClick={handleNextMonth}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>

                <div className="calendar-grid">
                  {dayNames.map((day) => (
                    <div key={day} className="calendar-day-name">
                      {day}
                    </div>
                  ))}
                  {getCalendarDays().map((date, index) =>
                    date ? (
                      <button
                        key={index}
                        type="button"
                        className={`calendar-day ${
                          isToday(date) ? 'today' : ''
                        } ${isSelected(date) ? 'selected' : ''} ${
                          isPastDate(date) ? 'disabled' : ''
                        }`}
                        onClick={() => !isPastDate(date) && handleDateSelect(date)}
                        disabled={isPastDate(date)}
                      >
                        {date.getDate()}
                      </button>
                    ) : (
                      <div key={index} className="calendar-day empty" />
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Time Picker */}
        <div className="datetime-field">
          <label className="form-label">
            Collection Time <span className="required">*</span>
          </label>
          <div className="time-input-wrapper">
            <Clock size={18} className="time-icon" />
            <select
              value={selectedTime}
              onChange={(e) => onTimeChange(e.target.value)}
              className="time-select"
              required
            >
              <option value="">Select time</option>
              {timeSlots.map((time) => (
                <option key={time} value={time}>
                  {formatTimeDisplay(time)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateTimePicker;
