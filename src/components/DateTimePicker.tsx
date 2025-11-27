import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';
import './DateTimePicker.css';

interface DateTimePickerProps {
  selectedDate: string;
  selectedTime: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  allowPastDates?: boolean;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
  allowPastDates = false,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 });
  const dateButtonRef = React.useRef<HTMLButtonElement>(null);
  const calendarRef = React.useRef<HTMLDivElement>(null);

  const updateCalendarPosition = () => {
    if (dateButtonRef.current) {
      const rect = dateButtonRef.current.getBoundingClientRect();
      const calendarHeight = calendarRef.current?.offsetHeight || 350;

      // Check if calendar would go off bottom, if so position above
      let top = rect.bottom + 8;
      if (top + calendarHeight > window.innerHeight) {
        top = rect.top - calendarHeight - 8;
      }

      setCalendarPosition({
        top: top,
        left: rect.left,
      });
    }
  };

  React.useEffect(() => {
    if (showCalendar) {
      // Calculate position after DOM renders
      requestAnimationFrame(() => {
        updateCalendarPosition();
      });

      window.addEventListener('scroll', updateCalendarPosition, true);
      window.addEventListener('resize', updateCalendarPosition);

      return () => {
        window.removeEventListener('scroll', updateCalendarPosition, true);
        window.removeEventListener('resize', updateCalendarPosition);
      };
    }
  }, [showCalendar]);

  // Validate and format time input (11:00 to 21:00)
  const validateTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return selectedTime;
    if (hours < 11 || hours > 21 || minutes < 0 || minutes > 59) return selectedTime;
    if (hours === 21 && minutes > 0) return selectedTime;
    return time;
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
    <div className={`datetime-picker ${showCalendar ? 'calendar-open' : ''}`}>
      <div className="datetime-row">
        {/* Date Picker */}
        <div className="datetime-field">
          <label className="form-label">
            Collection Date <span className="required">*</span>
          </label>
          <div className="date-input-wrapper">
            <button
              ref={dateButtonRef}
              type="button"
              className="date-input"
              onClick={() => setShowCalendar(!showCalendar)}
            >
              <Calendar size={18} />
              <span>{formatSelectedDate()}</span>
            </button>

            {showCalendar &&
              createPortal(
                <div
                  ref={calendarRef}
                  className="calendar-dropdown"
                  style={{
                    position: 'fixed',
                    top: `${calendarPosition.top}px`,
                    left: `${calendarPosition.left}px`,
                    zIndex: 10000,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
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
                            !allowPastDates && isPastDate(date) ? 'disabled' : ''
                          }`}
                          onClick={() => (allowPastDates || !isPastDate(date)) && handleDateSelect(date)}
                          disabled={!allowPastDates && isPastDate(date)}
                        >
                          {date.getDate()}
                        </button>
                      ) : (
                        <div key={index} className="calendar-day empty" />
                      )
                    )}
                  </div>
                </div>,
                document.body
              )}
          </div>
        </div>

        {/* Time Picker */}
        <div className="datetime-field">
          <label className="form-label">
            Collection Time <span className="required">*</span>
            <span className="time-hint">(11:00 - 21:00)</span>
          </label>
          <div className="time-input-wrapper">
            <Clock size={18} className="time-icon" />
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => onTimeChange(validateTime(e.target.value))}
              className="time-input"
              min="11:00"
              max="21:00"
              required
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateTimePicker;
