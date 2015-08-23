import kivy
kivy.require('1.8.0')

from kivy.config import Config
Config.set('graphics', 'width', '1120')
Config.set('graphics', 'height', '700')

from kivy.app import App
from kivy.clock import Clock
from kivy.uix.widget import Widget
from kivy.core.window import Window
from kivy.vector import Vector
from kivy.properties import ReferenceListProperty, NumericProperty, \
    ObjectProperty, StringProperty
from kivy.core.audio import SoundLoader
from random import randint

'''
--- Growth, even the biggest cannot live forever. ---

Growth - Version 1.0
Copyright (C) 2014 Kris Shamloo

Made with Kivy.
Made for Ludum Dare 31: Entire Game on One Screen
'''

# --- #

FOODSIZE = 25
OBSTACLESIZE = 25
SQUARESIZE = 9
SCORESIZE = 150
MENUSIZE = 250
MULTIPLIERSIZE = 50
OBSTACLEMAX = 13

class Square(Widget):
    """
    The player's class.
    """
    group = 'square'
    color = (1, 1, 1, 1)
    living = True
    line_bonus = NumericProperty(1)
    square_size = NumericProperty(SQUARESIZE)
    speed_max = NumericProperty(1.25)
    dx = NumericProperty(0.0)
    dy = NumericProperty(0.0)
    v = ReferenceListProperty(dx, dy)


    def move(self):
        self.pos = Vector(*self.v) + self.pos


    def go_to(self, *pos):
        """
        Calculates two velocities that will aim the square towards
        the coordinates of the touch or mouse click.
        """

        # get the length of the triangle legs between square and target
        mx = (pos[0] - self.center_x) * .1
        my = (pos[1] - self.center_y) * .1

        # the bigger of the two will determine which direction is maxed
        if (abs(mx) >= abs(my)):
            # to the right
            if mx >= 0:
                self.dx = self.speed_max
                self.dy = (self.speed_max * my) / abs(mx)
            # to the left
            else:
                self.dx = self.speed_max * -1
                self.dy = (self.speed_max * my) / abs(mx)
        else:
            # upwards
            if my >= 0:
                self.dx = (self.speed_max * mx) / abs(my)
                self.dy = self.speed_max
            # downwards
            else:
                self.dx = (self.speed_max * mx) / abs(my)
                self.dy = self.speed_max * -1

    def eat(self):
        self.square_size += 1 * self.line_bonus
        self.speed_max += .05 * self.line_bonus
        self.increase_bonus()

    def reset_bonus(self):
        self.line_bonus = 1

    def increase_bonus(self):
        self.line_bonus += 1

class Menu(Widget):
    group = 'menu'
    living = True
    menu_size = NumericProperty(MENUSIZE)
    color = (.8, 1, 1, 1)


class Food(Widget):
    group = 'food'
    living = True
    food_size = NumericProperty(FOODSIZE)
    color = (0, 1, .5, 1)


class Obstacle(Widget):
    group = 'obstacle'
    obstacle_size = NumericProperty(OBSTACLESIZE)
    color = (1, .2, .2, 1)


class Score(Widget):
    group = 'score'
    score_size = NumericProperty(SCORESIZE)
    score_label = StringProperty('score')
    score_text = StringProperty('')


class HighScore(Score):
    score_label = StringProperty('high score')


class Multiplier(Widget):
    group = 'multiplier'

# --- #

class Game(Widget):

    thing_list = []
    score = 0
    counter = 0
    food_level = 120
    obstacle_level = 240
    obstacle_count = 0
    playing = False
    menu_clickable = True
    game_music = SoundLoader.load('art/music.mp3')

    def on_touch_up(self, touch):

        for child in self.children:
            if child.collide_point(*touch.pos):
                if child.group == 'menu':
                    if self.menu_clickable:
                        self.clear_widgets()
                        self.thing_list = []
                        Clock.schedule_once(g.spawn_player)
                        if self.game_music:
                            self.game_music.play()
                            self.game_music.loop = True

            if child.group == 'square':
                child.reset_bonus()
                child.go_to(*touch.pos)

    def update(self, dt):

        kill = []
        
        # This is a gross way to do something that should probably be
        # refactored into a Clock.schedule_interval.
        self.counter += 1
        if self.counter % self.food_level == 0:
            if self.playing:
                Clock.schedule_once(self.add_food)
        if self.counter % self.obstacle_level == 0:
            if self.playing and self.obstacle_count < OBSTACLEMAX:
                Clock.schedule_once(self.add_obstacle)
            # Briefly disables restarting the game in case the player
            # was clicking the center when the game ended.
            else:
                self.menu_clickable = True

        # Because there is only one moving object, a single loop through
        # is sufficient for collision detection.
        for i in range(1, len(self.thing_list)):
            if self.thing_list[0].collide_widget(self.thing_list[i]):
                # grow the square, flag food to be deleted
                if self.thing_list[i].group == 'food':
                    self.thing_list[0].eat()
                    kill.append(self.thing_list[i])
                # end the game
                if self.thing_list[i].group == 'obstacle':
                    Clock.schedule_once(self.game_over)

        # bounce off left
        if self.playing:
            if (self.thing_list[0].x <= 0):
                self.thing_list[0].x = 0
                self.thing_list[0].dx *= -1
                self.thing_list[0].increase_bonus()

            # bounce off right   
            elif (self.thing_list[0].right >= self.width):
                self.thing_list[0].right = self.width
                self.thing_list[0].dx *= -1
                self.thing_list[0].increase_bonus()

            # bounce off bottom
            if (self.thing_list[0].y <= 0):
                self.thing_list[0].y = 0
                self.thing_list[0].dy *= -1
                self.thing_list[0].increase_bonus()

            # bounce off top
            if (self.thing_list[0].top >= self.height):
                self.thing_list[0].top = self.height
                self.thing_list[0].dy *= -1
                self.thing_list[0].increase_bonus()

            # move organism
            self.thing_list[0].move()
        
        for i in range(len(self.thing_list), -1, -1):
            for kill_thing in kill:
                if kill_thing in self.thing_list:
                    self.thing_list.remove(kill_thing)
                    self.remove_widget(kill_thing)


    def spawn_player(self, dt):
        s = Square()
        s.pos[0] = Window.width/2
        s.pos[1] = Window.height/2
        self.playing = True
        self.score = 0
        self.add_widget(s)
        self.thing_list.append(s)


    def add_food(self, dt):
        """
        Food can spawn anywhere on the map, including the player's location.
        """
        f = Food()
        f.pos[0] = randint(FOODSIZE * 1.2, Window.width - (FOODSIZE * 1.2))
        f.pos[1] = randint(FOODSIZE * 1.2, Window.height - (FOODSIZE * 1.2))
        self.add_widget(f)
        self.thing_list.append(f)


    def add_obstacle(self, dt):
        """
        Obstacles can spawn anywhere on the map, excluding the player's location.
        Having obstacles spawn in front of you makes the game feel unfair.
        """

        posx = randint(OBSTACLESIZE * 1.2, Window.width - (OBSTACLESIZE * 1.2))
        posy = randint(OBSTACLESIZE * 1.2, Window.height - (OBSTACLESIZE * 1.2))
        sqpx = self.thing_list[0].pos[0]
        sqpy = self.thing_list[0].pos[1]
        pad = 1.5 * self.thing_list[0].square_size

        if (posx < (sqpx - pad) or posx > (sqpx + pad)) and \
           (posy < (sqpy - pad) or posy > (sqpy + pad)):
            o = Obstacle()
            o.pos[0] = posx
            o.pos[1] = posy
            self.add_widget(o)
            self.thing_list.append(o)
            self.obstacle_count += 1


    def game_over(self, dt):
        self.score = self.thing_list[0].square_size - SQUARESIZE
        self.clear_widgets()
        self.thing_list = []
        self.playing = False
        self.menu_clickable = False
        Clock.schedule_once(self.menu)


    def menu(self, dt):

        m = Menu()
        m.center_x = Window.width / 2
        m.center_y = Window.height / 2
        self.add_widget(m)
        self.thing_list.append(m)

        s = Score()
        s.score_text = str(self.score)
        s.center_x = Window.width / 4
        s.center_y = Window.height / 2
        self.add_widget(s)

        h = HighScore()
        h.score_text = self.get_high_score()
        h.center_x = Window.width* 3 / 4
        h.center_y = Window.height / 2
        self.add_widget(h)


    def get_high_score(self):
        score_file = open('score.txt', 'r')
        high_score = score_file.read()
        score_file.close()
        if self.score > int(high_score):
            score_file = open('score.txt', 'w')
            score_file.write(str(self.score))
            score_file.close()
            return str(self.score)
        else:
            return high_score

# --- #

class Growth(App):
    def build(self):
        global g
        g = Game()
        Clock.schedule_once(g.menu)
        Clock.schedule_interval(g.update, 1.0/60.0)
        return g

g = ObjectProperty(None)
Growth().run()
