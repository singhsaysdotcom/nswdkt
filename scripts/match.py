#!/usr/bin/env python

import json
import sys

filename = '../data/car.json'
fp = open(filename, 'r')
data = json.load(fp)

def find(f, seq):
  for item in seq:
    if f(item):
      return item
  return None


def getfn(section, question):
  question = question.zfill(3)
  if section in data:
    f = find(lambda x: x['number'] == question, data[section]['questions'])
    if f is None:
      print "invalid question %s" % question
      return
    print f['images'] if 'images' in f else None

def setfn(section, question, img, fmt="png"):
  question = question.zfill(3)
  img = img.zfill(3)
  if section in data:
    f = find(lambda x: x['number'] == question, data[section]['questions'])
    if f is None:
      print "invalid question %s" % question
      return
    if 'images' in f:
      f['images'].append('img-%s.%s' % (img, fmt))
    else:
      f['images'] = ['img-%s.%s' % (img, fmt)]

def clearfn(section, question):
  question = question.zfill(3)
  if section in data:
    f = find(lambda x: x['number'] == question, data[section]['questions'])
    if f is None:
      print "invalid question %s" % question
      return
    if 'images' in f:
      del f['images']

def clearallfn(*unused):
  for section in data:
    for question in data[section]['questions']:
      if 'images' in question:
        del question['images']

def helpfn(unused):
  print "g [S] [Q]: get image for section S, question Q"
  print "s [S] [Q] [I] [F]: set image for section S, question Q as image I with format F (default: png)"
  print "c [S] [Q]: clear image for section S, question Q"
  print "a: clear all images"
  print "?: print this help"
  print "w: write outfile"
  print "q: quit"
  print "x: write outfile and quit"

def writefn(*unused):
  with open(filename, 'w') as f:
    json.dump(data, f, indent=2)

def quitfn(*unused):
  sys.exit(0)

def writequitfn(*unused):
  writefn(*unused)
  quitfn(*unused)

command_map = {
  'g': getfn,
  's': setfn,
  'c': clearfn,
  'a': clearallfn,
  'w': writefn,
  'q': quitfn,
  'x': writequitfn,
  '?': helpfn,
}

def process_input(x, args):
  if x and x in command_map:
    parts = args.split(" ")
    command_map[x](*parts[1:])

while True:
  x = raw_input('> ')
  if x: process_input(x[0], x)

