/*
  # Seed Sample Data for CineEats

  ## Summary
  Inserts sample movies and other reference data to populate the platform.
  This includes movies, and placeholder theater/restaurant data that reps can manage.

  ## Notes
  - Only inserts movies as they don't need owner references
  - Theaters and restaurants will be created by reps after signup
*/

INSERT INTO movies (title, genre, language, duration_minutes, rating, description, poster_url, release_date) VALUES
(
  'Stellar Odyssey',
  ARRAY['Sci-Fi', 'Adventure'],
  'English',
  148,
  'PG-13',
  'An epic journey through the cosmos as a crew of astronauts discovers a new habitable world, only to find they are not alone.',
  'https://images.pexels.com/photos/1341279/pexels-photo-1341279.jpeg?auto=compress&cs=tinysrgb&w=400',
  '2026-05-15'
),
(
  'Midnight in Mumbai',
  ARRAY['Drama', 'Romance'],
  'Hindi',
  135,
  'U/A',
  'A bittersweet love story set against the vibrant backdrop of Mumbai''s nightlife, following two strangers who meet on a late train.',
  'https://images.pexels.com/photos/3075993/pexels-photo-3075993.jpeg?auto=compress&cs=tinysrgb&w=400',
  '2026-04-20'
),
(
  'The Last Fortress',
  ARRAY['Action', 'Thriller'],
  'English',
  127,
  'A',
  'A retired special forces operative is forced back into action when a crime syndicate targets his family in a remote mountain fortress.',
  'https://images.pexels.com/photos/2873486/pexels-photo-2873486.jpeg?auto=compress&cs=tinysrgb&w=400',
  '2026-05-01'
),
(
  'Laugh Factory',
  ARRAY['Comedy', 'Family'],
  'English',
  110,
  'U',
  'A dysfunctional family of stand-up comedians tries to save their failing comedy club in this heartwarming and hilarious adventure.',
  'https://images.pexels.com/photos/713149/pexels-photo-713149.jpeg?auto=compress&cs=tinysrgb&w=400',
  '2026-03-12'
),
(
  'Dark Waters',
  ARRAY['Horror', 'Mystery'],
  'English',
  118,
  'A',
  'A marine biologist uncovers an ancient evil lurking in the depths of a newly discovered underwater cave system.',
  'https://images.pexels.com/photos/1730754/pexels-photo-1730754.jpeg?auto=compress&cs=tinysrgb&w=400',
  '2026-05-22'
),
(
  'Rang De Sapna',
  ARRAY['Musical', 'Drama'],
  'Hindi',
  155,
  'U',
  'A classical dancer from a small village pursues her dreams in the city, navigating love, tradition, and modern life.',
  'https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?auto=compress&cs=tinysrgb&w=400',
  '2026-04-05'
)
ON CONFLICT DO NOTHING;
