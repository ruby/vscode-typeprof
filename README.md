# Ruby TypeProf VSCode Integration

*NOTE: This extenstion is very preliminary.*

This is a VSCode extension to help you write Ruby code by using an code analyzer called [Ruby TypeProf](https://github.com/ruby/typeprof/) as a backend.

## Requirements

* Ruby 3.1.0 or later
* TypeProf 0.20.0 or later

## How to use this extension

1. Install Ruby TypeProf VSCode Integration
2. Open your project's directory by VSCode
3. Open the terminal
4. Install Ruby 3.1.0 or later
5. Add gem "typeprof" to `Gemfile`
6. execute `bundle install`
7. execute `rbs collection init`
8. execute `rbs collection install`
9. open the rbswiki folder by VSCode
10. Edit `typeprof.rbs`

## Troubleshooting

Check out -> [TypeProf's document](https://github.com/ruby/typeprof#documentation)

## Limitations

* This extension only uses `typeprof.rbs`

see also [How to use TypeProf for IDE](https://github.com/ruby/typeprof/blob/master/doc/ide.md)

## How to develop this extension

See [development.md](https://github.com/ruby/vscode-typeprof/blob/master/development.md).
