package com.example.controller;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.date.DateUtil;
import cn.hutool.core.io.FileUtil;
import cn.hutool.core.io.IoUtil;
import cn.hutool.poi.excel.ExcelUtil;
import cn.hutool.poi.excel.ExcelWriter;
import com.example.common.Result;
import com.example.entity.Attendence;
import com.example.service.AttendenceService;
import com.example.entity.User;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import org.springframework.web.bind.annotation.*;
import com.example.exception.CustomException;
import cn.hutool.core.util.StrUtil;

import javax.annotation.Resource;
import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.util.*;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/attendence")
public class AttendenceController {
    @Resource
    private AttendenceService attendenceService;
    @Resource
    private HttpServletRequest request;

    public User getUser() {
        User user = (User) request.getSession().getAttribute("user");
        if (user == null) {
            throw new CustomException("-1", "请登录");
        }
        return user;
    }

    @PostMapping
    public Result<?> save(@RequestBody Attendence attendence) {
        return Result.success(attendenceService.save(attendence));
    }

    @PutMapping
    public Result<?> update(@RequestBody Attendence attendence) {
        return Result.success(attendenceService.updateById(attendence));
    }

    @DeleteMapping("/{id}")
    public Result<?> delete(@PathVariable Long id) {
        attendenceService.removeById(id);
        return Result.success();
    }

    @GetMapping("/{id}")
    public Result<?> findById(@PathVariable Long id) {
        return Result.success(attendenceService.getById(id));
    }

    @GetMapping
    public Result<?> findAll() {
        return Result.success(attendenceService.list());
    }

    @GetMapping("/page")
    public Result<?> findPage(@RequestParam(required = false, defaultValue = "") String name,
                                                @RequestParam(required = false, defaultValue = "1") Integer pageNum,
                                                @RequestParam(required = false, defaultValue = "10") Integer pageSize) {
        LambdaQueryWrapper<Attendence> query = Wrappers.<Attendence>lambdaQuery().orderByDesc(Attendence::getId);
        if (StrUtil.isNotBlank(name)) {
            query.like(Attendence::getName, name);
        }
        return Result.success(attendenceService.page(new Page<>(pageNum, pageSize), query));
    }

    @GetMapping("/export")
    public void export(HttpServletResponse response) throws IOException {

        List<Map<String, Object>> list = CollUtil.newArrayList();

        List<Attendence> all = attendenceService.list();
        for (Attendence obj : all) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("日期", obj.getDate());
            row.put("出勤id", obj.getId());
            row.put("", obj.getName());
            row.put("员工id", obj.getStaffid());

            list.add(row);
        }

        // 2. 写excel
        ExcelWriter writer = ExcelUtil.getWriter(true);
        writer.write(list, true);

        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8");
        String fileName = URLEncoder.encode("出勤信息", "UTF-8");
        response.setHeader("Content-Disposition", "attachment;filename=" + fileName + ".xlsx");

        ServletOutputStream out = response.getOutputStream();
        writer.flush(out, true);
        writer.close();
        IoUtil.close(System.out);
    }

    @GetMapping("/upload/{fileId}")
    public Result<?> upload(@PathVariable String fileId) {
        String basePath = System.getProperty("user.dir") + "/src/main/resources/static/file/";
        List<String> fileNames = FileUtil.listFileNames(basePath);
        String file = fileNames.stream().filter(name -> name.contains(fileId)).findAny().orElse("");
        List<List<Object>> lists = ExcelUtil.getReader(basePath + file).read(1);
        List<Attendence> saveList = new ArrayList<>();
        for (List<Object> row : lists) {
            Attendence obj = new Attendence();
            obj.setDate((String) row.get(1));
            obj.setName((String) row.get(2));
            obj.setStaffid(Integer.valueOf((String) row.get(3)));

            saveList.add(obj);
        }
        attendenceService.saveBatch(saveList);
        return Result.success();
    }

}
