import { useState, useMemo } from 'react';
import { 
    format, 
    addMonths, 
    subMonths, 
    startOfMonth, 
    endOfMonth, 
    startOfWeek, 
    endOfWeek, 
    isSameMonth, 
    isSameDay, 
    addDays, 
    eachDayOfInterval,
    parseISO,
    isWithinInterval,
    isPast,
    isToday
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/calendar.css';

export default function ScheduleCalendar({ schedules = [], onSelectSchedule }) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [expandedDate, setExpandedDate] = useState(null); // yyyy-MM-dd

    // Navigation handlers
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const goToToday = () => setCurrentMonth(new Date());

    // Calculate days to display (full weeks covering the month)
    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const startDate = startOfWeek(monthStart);
        
        // Always show 6 weeks (42 days) for a consistent grid layout
        return Array.from({ length: 42 }).map((_, i) => addDays(startDate, i));
    }, [currentMonth]);

    // Map schedules to specific dates for efficient lookup
    const schedulesByDate = useMemo(() => {
        const map = {};
        
        schedules.forEach(schedule => {
            try {
                const start = parseISO(schedule.startDate);
                const end = parseISO(schedule.endDate);
                
                // Get all days within the schedule interval
                const intervalDays = eachDayOfInterval({ start, end });
                
                intervalDays.forEach(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    if (!map[dateStr]) map[dateStr] = [];
                    map[dateStr].push(schedule);
                });
            } catch (e) {
                console.error("Date parsing error for schedule:", schedule.title, e);
            }
        });
        
        return map;
    }, [schedules]);

    return (
        <div className="calendar-container">
            {/* Header */}
            <div className="calendar-header">
                <div className="calendar-header-left">
                    <h2 className="month-display">
                        {format(currentMonth, 'yyyy년 M월', { locale: ko })}
                    </h2>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="calendar-nav-btn" onClick={prevMonth}>
                            <FiChevronLeft />
                        </button>
                        <button className="calendar-nav-btn" onClick={nextMonth}>
                            <FiChevronRight />
                        </button>
                    </div>
                </div>
                <button className="today-btn" onClick={goToToday}>오늘</button>
            </div>

            {/* Weekdays Header */}
            <div className="calendar-grid-header">
                {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                    <div key={day} className="weekday-header">{day}</div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="calendar-days-grid">
                <AnimatePresence initial={false}>
                    {calendarDays.map((day, idx) => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const daySchedules = schedulesByDate[dateStr] || [];
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        const isDayToday = isToday(day);

                        return (
                            <motion.div
                                key={`${dateStr}-${format(currentMonth, 'yyyy-MM')}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className={`calendar-day-cell ${!isCurrentMonth ? 'other-month' : ''} ${isDayToday ? 'is-today' : ''}`}
                                onClick={() => {
                                    if (daySchedules.length > 1) {
                                        setExpandedDate(dateStr);
                                    } else if (daySchedules.length === 1) {
                                        onSelectSchedule(daySchedules[0]);
                                    }
                                }}
                            >
                                <span className="day-number">{format(day, 'd')}</span>
                                
                                <div className="day-schedules">
                                    {daySchedules.slice(0, 3).map((sch, sIdx) => (
                                        <div 
                                            key={`${sch.id}-${sIdx}`} 
                                            className={`calendar-schedule-item ${isDayToday ? 'd-day' : (isPast(day) ? 'past' : '')}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSelectSchedule(sch);
                                            }}
                                            title={sch.title}
                                        >
                                            {isDayToday && <span className="d-day-badge">D-Day</span>}
                                            {sch.title}
                                        </div>
                                    ))}
                                    {daySchedules.length > 3 && (
                                        <div 
                                            className="more-schedules"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setExpandedDate(dateStr);
                                            }}
                                        >
                                            +{daySchedules.length - 3}건 더보기
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Expanded Day Overlay */}
            <AnimatePresence>
                {expandedDate && (
                    <div className="calendar-overlay" onClick={() => setExpandedDate(null)}>
                        <motion.div 
                            className="expanded-day-modal"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="expanded-header">
                                <h3>{format(parseISO(expandedDate), 'M월 d일 일차별 계획', { locale: ko })}</h3>
                                <button className="close-expanded" onClick={() => setExpandedDate(null)}>×</button>
                            </div>
                            <div className="expanded-list">
                                {(schedulesByDate[expandedDate] || []).map((sch, idx) => (
                                    <div 
                                        key={`${sch.id}-${idx}`}
                                        className="expanded-item"
                                        onClick={() => {
                                            onSelectSchedule(sch);
                                            setExpandedDate(null);
                                        }}
                                    >
                                        <div className="item-title-row">
                                            <span className="item-emoji">📅</span>
                                            <span className="item-title">{sch.title}</span>
                                        </div>
                                        <div className="item-meta">
                                            {sch.startDate} ~ {sch.endDate}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
