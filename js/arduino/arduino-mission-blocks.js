/* ========================================================================
   ARDUINO-MISSION-BLOCKS.JS — پیکربندیِ بلوک‌های هر مأموریت
   ------------------------------------------------------------------------
   این فایل مشخص می‌کند در حالتِ بلوکی، برای هر مأموریت دقیقاً کدام بلوک‌ها
   در جعبه‌ابزار (سمتِ چپِ صفحه‌ی بلوک‌ها) نشان داده شوند — تا بچه‌ها با
   دیدنِ همه‌ی بلوک‌های ممکن غرق نشوند و فقط همان‌هایی را ببینند که برای
   همان مأموریتِ خاص لازم است.

   نحوه‌ی استفاده:
   • برای اضافه/حذف‌کردنِ یک بلوک از یک مأموریت، فقط لیستِ همان مأموریت را
     پایین‌تر ویرایش کن. لازم نیست وارد arduino-blocks.js یا arduino-sim.js
     شوی.
   • کلیدها (serial, ledOn, blink, ...) باید دقیقاً همان کلیدهایی باشند که
     در TASKS داخلِ arduino-sim.js تعریف شده‌اند.
   • این فایل باید در HTML، **قبل از** arduino-blocks.js لود شود:

       <script src="js/arduino/arduino-mission-blocks.js"></script>
       <script src="js/arduino/arduino-blocks.js"></script>
       <script src="js/arduino/arduino-sim.js"></script>

   بلوک‌هایی که همیشه، در همه‌ی مأموریت‌ها هستند و لازم نیست این‌جا تکرار
   شوند (این‌ها را ArduinoBlocks خودش همیشه اضافه می‌کند):
       ard_setup, ard_loop, ard_global, ard_comment, ard_wait, math_number

   فهرستِ همه‌ی نام‌های بلوکِ معتبر (برای مراجعه‌ی سریع، بر اساسِ دسته‌بندیِ
   جعبه‌ابزارِ کامل):

       شروع:        ard_setup, ard_loop, ard_global, ard_comment
       کنترل:       controls_if, controls_repeat_ext, controls_whileUntil,
                    controls_for, controls_flow_statements,
                    ard_wait, ard_wait_micro
       پایه‌ها:      ard_pin_mode, ard_digital_write, ard_digital_read,
                    ard_if_pin, ard_analog_write, ard_analog_read,
                    ard_pot_led, ard_pin_state
       متغیرها:     ard_var_declare, variables_get, variables_set
       آرایه‌ها:     ard_array_declare, ard_array_get, ard_array_set,
                    ard_array_length
       ریاضی:       math_number, math_arithmetic, ard_math_single,
                    math_modulo, math_constrain, math_random_int,
                    ard_math_map
       منطق:        logic_compare, logic_operation, logic_negate,
                    logic_boolean
       متن و سریال:  text, ard_serial_begin, ard_serial_print
       سروو موتور:   ard_servo_declare, ard_servo_attach, ard_servo_write,
                    ard_servo_read, ard_servo_detach
       کدِ خام:      ard_raw_code
       توابعِ من:    '__PROCEDURES__'  ← این یکی نامِ یک بلوک نیست؛ یک
                    رشته‌ی خاص است که اگر در لیستِ یک مأموریت باشد، دسته‌ی
                    «توابعِ من» هم برای آن مأموریت نشان داده می‌شود.
   ======================================================================== */

window.ARDUINO_MISSION_BLOCKS = {
  // مأموریتِ «Hello World» (سریال) — چاپ‌کردنِ یک پیام روی سریال مانیتور.
  // بلوکِ «متن» (text) لازم است تا بشود رشته‌ی "Hello World" را تایپ کرد.
  serial: ['ard_serial_begin', 'ard_serial_print'],

  // مأموریتِ «روشن کردن یک LED». بلوک‌های متغیر هم اضافه شده‌اند چون کدِ
  // شروع‌کننده‌ی این مأموریت از «int ledPin = ...» استفاده می‌کند.
  ledOn: ['ard_pin_mode', 'ard_digital_write', 'variables_get'],

  // مأموریتِ «چشمک‌زن» (Blink).
  blink: ['ard_pin_mode', 'ard_digital_write','variables_get'],

  // مأموریتِ «دکمه» (Button) — خواندنِ یک ورودیِ دیجیتال و شرط‌گذاری رویش.
  button: ['ard_pin_mode', 'ard_digital_write', 'ard_digital_read', 'ard_if_pin', 'controls_if', 'logic_compare','ard_var_declare','variables_get','ard_pin_state'],

  // مأموریتِ «پتانسیومتر» (Pot) — خواندنِ آنالوگ و تبدیلِ بازه با map.
  // ard_pot_led یک بلوکِ اختصاصی/میان‌بر است: فقط پینِ LED و پینِ ولوم را
  // می‌گیرد و analogRead + map + analogWrite را با هم، در یک بلوک انجام
  // می‌دهد — بلوک‌های analog_read/analog_write/math_map هم کنارش مانده‌اند
  // تا هرکس خواست همان راهِ طولانی و مرحله‌به‌مرحله را هم بسازد.
  pot: ['ard_pot_led','ard_pin_mode', 'ard_analog_read', 'ard_analog_write', 'ard_math_map', 'math_arithmetic','ard_var_declare','variables_get'],

  // مأموریتِ «سروو موتور».
  servo: ['ard_servo_declare', 'ard_servo_attach', 'ard_servo_write', 'ard_servo_read', 'ard_servo_detach','ard_var_declare','variables_get']
};
